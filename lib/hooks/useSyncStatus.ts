import { useState, useEffect } from 'react';

import { fileQueueManager } from '../storage/FileQueueManager';
import { sqliteManager } from '../storage/SQLiteManager';
import { syncManager, SyncStatus } from '../storage/SyncManager';

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [dataQueueSize, setDataQueueSize] = useState(0);
  const [fileQueueSize, setFileQueueSize] = useState(0);

  useEffect(() => {
    // Listen to sync status changes
    const unsubscribe = syncManager.onStatusChange(setStatus);

    // Check queue sizes periodically
    const checkQueues = async () => {
      const dataQueue = await sqliteManager.getSyncQueue();
      setDataQueueSize(dataQueue.length);

      const fileQueue = fileQueueManager.getQueue();
      setFileQueueSize(fileQueue.length);
    };

    checkQueues();
    const interval = setInterval(checkQueues, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    status,
    dataQueueSize,
    fileQueueSize,
    totalPending: dataQueueSize + fileQueueSize,
    isSyncing: status === 'syncing',
    hasError: status === 'error',
    hasPendingChanges: dataQueueSize > 0 || fileQueueSize > 0,
  };
}







