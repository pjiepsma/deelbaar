import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { payloadClient } from '../api/PayloadClient';
import { sqliteManager, SyncQueue } from './SQLiteManager';
import { fileQueueManager } from './FileQueueManager';

export type SyncStatus = 'idle' | 'syncing' | 'error';

class SyncManager {
  private syncStatus: SyncStatus = 'idle';
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private isOnline = true;
  private initialized = false;
  private netInfoUnsubscribe: (() => void) | null = null;
  private appStateSubscription: { remove: () => void } | null = null;

  async init() {
    if (this.initialized) {
      return;
    }

    // Initialize SQLite
    await sqliteManager.init();

    // Initialize file queue manager
    await fileQueueManager.init();

    // Listen for network changes
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
    }
    this.netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // If we just came online, sync
      if (wasOffline && this.isOnline) {
        this.sync();
      }
    });

    // Listen for app state changes
    this.appStateSubscription?.remove();
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

    // Start periodic sync (every 30 seconds)
    this.startPeriodicSync();

    // Do initial sync
    await this.sync();

    this.initialized = true;
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      this.sync();
    }
  };

  private startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && payloadClient.isAuthenticated()) {
        this.sync();
      }
    }, 30000); // 30 seconds
  }

  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  onStatusChange(callback: (status: SyncStatus) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private setStatus(status: SyncStatus) {
    this.syncStatus = status;
    this.listeners.forEach((listener) => listener(status));
  }

  getStatus() {
    return this.syncStatus;
  }

  async sync() {
    if (!this.isOnline || !payloadClient.isAuthenticated()) {
      return;
    }

    if (this.syncStatus === 'syncing') {
      return; // Already syncing
    }

    this.setStatus('syncing');

    try {
      // 1. Process file upload queue first
      await fileQueueManager.processQueue();

      // 2. Process sync queue (upload local changes)
      await this.processSyncQueue();

      // 3. Pull data from server
      await this.pullData();

      this.setStatus('idle');
    } catch (error) {
      console.error('Sync error:', error);
      this.setStatus('error');
    }
  }

  private async processSyncQueue() {
    const queue = await sqliteManager.getSyncQueue();

    for (const item of queue) {
      try {
        await this.processSyncItem(item);
        await sqliteManager.removeSyncQueueItem(item.id);
      } catch (error: any) {
        console.error('Sync queue item error:', error);

        // If error is about missing required fields, remove immediately
        if (error.message?.includes('Record ID required') || error.message?.includes('required for')) {
          console.error('Removing invalid sync item (missing required fields):', item);
          await sqliteManager.removeSyncQueueItem(item.id);
          continue;
        }

        // Increment retry count
        const newRetryCount = item.retryCount + 1;

        // If too many retries, remove from queue
        if (newRetryCount > 5) {
          console.error('Removing failed sync item after max retries:', item);
          await sqliteManager.removeSyncQueueItem(item.id);
        } else {
          await sqliteManager.updateSyncQueueError(
            item.id,
            error.message || 'Unknown error',
            newRetryCount
          );
        }
      }
    }
  }

  private async processSyncItem(item: SyncQueue) {
    const data = JSON.parse(item.data);

    switch (item.operation) {
      case 'create':
        await payloadClient.create(item.collection, data);
        break;
      case 'update':
        if (!item.recordId) throw new Error('Record ID required for update');
        await payloadClient.update(item.collection, item.recordId, data);
        break;
      case 'delete':
        if (!item.recordId) throw new Error('Record ID required for delete');
        await payloadClient.delete(item.collection, item.recordId);
        break;
    }
  }

  private async pullData() {
    const user = payloadClient.getUser();
    if (!user) return;

    try {
      // Pull listings
      const { data: listingsData } = await payloadClient.findMany('listings', {
        limit: 1000,
        depth: 1,
      });

      if (listingsData?.docs) {
        await sqliteManager.saveListings(listingsData.docs);
      }

      // Pull user's own data
      const { data: userData } = await payloadClient.findById('users', user.id, 1);

      if (userData) {
        await sqliteManager.saveUser(userData);
      }

      // Pull user's favorites
      const { data: favoritesData } = await payloadClient.findMany('favorites', {
        where: { user: { equals: user.id } },
        limit: 1000,
      });

      if (favoritesData?.docs) {
        await sqliteManager.saveFavorites(favoritesData.docs, user.id);
      }
    } catch (error) {
      console.error('Pull data error:', error);
      throw error;
    }
  }

  // Helper methods for queuing operations
  async queueCreate(collection: string, data: any) {
    await sqliteManager.addToSyncQueue({
      collection,
      operation: 'create',
      data: JSON.stringify(data),
    });

    // Try to sync immediately if online
    if (this.isOnline) {
      this.sync();
    }
  }

  async queueUpdate(collection: string, id: string, data: any) {
    await sqliteManager.addToSyncQueue({
      collection,
      operation: 'update',
      data: JSON.stringify(data),
      recordId: id,
    });

    // Try to sync immediately if online
    if (this.isOnline) {
      this.sync();
    }
  }

  async queueDelete(collection: string, id: string) {
    await sqliteManager.addToSyncQueue({
      collection,
      operation: 'delete',
      data: JSON.stringify({}),
      recordId: id,
    });

    // Try to sync immediately if online
    if (this.isOnline) {
      this.sync();
    }
  }

  async clearAllData() {
    await sqliteManager.clearAllData();
    await fileQueueManager.clearQueue();
  }

  async reset() {
    this.stopPeriodicSync();
    this.netInfoUnsubscribe?.();
    this.netInfoUnsubscribe = null;
    this.appStateSubscription?.remove();
    this.appStateSubscription = null;
    await this.clearAllData();
    this.initialized = false;
    this.setStatus('idle');
  }
}

export const syncManager = new SyncManager();

