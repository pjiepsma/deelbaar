import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('deelbaar.db');

const isNoSuchTableError = (error: any) =>
  typeof error?.message === 'string' && error.message.includes('no such table');

export interface SyncQueue {
  id: string;
  collection: string;
  operation: 'create' | 'update' | 'delete';
  data: string; // JSON stringified
  recordId?: string;
  createdAt: number;
  retryCount: number;
  error?: string;
}

export class SQLiteManager {
  async init() {
    // Create tables
    await this.execute(`
      CREATE TABLE IF NOT EXISTS listings (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        owner_id TEXT,
        location TEXT,
        category TEXT,
        tags TEXT,
        created_at INTEGER,
        updated_at INTEGER,
        synced INTEGER DEFAULT 0
      )
    `);

    // Users table for caching user/profile data
    await this.execute(`
      CREATE TABLE IF NOT EXISTS users_cache (
        id TEXT PRIMARY KEY,
        email TEXT,
        username TEXT,
        name TEXT,
        surname TEXT,
        avatar TEXT,
        role TEXT,
        is_anonymous INTEGER DEFAULT 0,
        updated_at INTEGER,
        synced INTEGER DEFAULT 0
      )
    `);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS pictures (
        id TEXT PRIMARY KEY,
        photo_id TEXT,
        created_by TEXT,
        listing_id TEXT,
        review_id TEXT,
        created_at INTEGER,
        synced INTEGER DEFAULT 0
      )
    `);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        rating INTEGER,
        description TEXT,
        created_by TEXT,
        listing_id TEXT,
        created_at INTEGER,
        synced INTEGER DEFAULT 0
      )
    `);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS favorites (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        listing_id TEXT,
        created_at INTEGER,
        synced INTEGER DEFAULT 0,
        UNIQUE(user_id, listing_id)
      )
    `);

    // Sync queue table
    await this.execute(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        collection TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        record_id TEXT,
        created_at INTEGER NOT NULL,
        retry_count INTEGER DEFAULT 0,
        error TEXT
      )
    `);

    // Create indexes
    await this.execute('CREATE INDEX IF NOT EXISTS idx_listings_owner ON listings(owner_id)');
    await this.execute('CREATE INDEX IF NOT EXISTS idx_pictures_listing ON pictures(listing_id)');
    await this.execute('CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews(listing_id)');
    await this.execute('CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)');
    await this.execute('CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at)');
  }

  async execute(query: string, params?: any[]) {
    try {
      return db.runSync(query, params || []);
    } catch (error) {
      console.error('SQLite execute error:', error);
      throw error;
    }
  }

  async executeBatch(queries: Array<{ query: string; params?: any[] }>) {
    try {
      await db.withTransactionAsync(async () => {
        for (const { query, params } of queries) {
          await db.runAsync(query, params || []);
        }
      });
    } catch (error) {
      console.error('SQLite batch error:', error);
      throw error;
    }
  }

  // Listings
  async getListings() {
    try {
      const result = db.getAllSync('SELECT * FROM listings ORDER BY created_at DESC');
      return (result || []).map((listing: any) => ({
        ...listing,
        location: typeof listing.location === 'string' ? JSON.parse(listing.location) : listing.location,
        tags: typeof listing.tags === 'string' ? JSON.parse(listing.tags) : listing.tags,
      }));
    } catch (error) {
      if (isNoSuchTableError(error)) {
        await this.init();
        return this.getListings();
      }
      throw error;
    }
  }

  async getListingById(id: string) {
    try {
      const result = db.getFirstSync('SELECT * FROM listings WHERE id = ?', [id]);
      if (!result) return null;
      return {
        ...result,
        location: typeof result.location === 'string' ? JSON.parse(result.location) : result.location,
        tags: typeof result.tags === 'string' ? JSON.parse(result.tags) : result.tags,
      };
    } catch (error) {
      if (isNoSuchTableError(error)) {
        await this.init();
        return this.getListingById(id);
      }
      throw error;
    }
  }

  async saveListings(listings: any[]) {
    const queries = listings.map((listing) => ({
      query: `
        INSERT OR REPLACE INTO listings 
        (id, name, description, owner_id, location, category, tags, created_at, updated_at, synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `,
      params: [
        listing.id,
        listing.name,
        listing.description,
        listing.owner?.id || listing.owner,
        typeof listing.location === 'string' ? listing.location : JSON.stringify(listing.location),
        listing.category,
        Array.isArray(listing.tags) ? JSON.stringify(listing.tags) : listing.tags,
        new Date(listing.createdAt).getTime(),
        new Date(listing.updatedAt).getTime(),
      ],
    }));

    await this.executeBatch(queries);
  }

  async createLocalListing(listing: any) {
    await this.execute(
      `INSERT INTO listings 
       (id, name, description, owner_id, location, category, tags, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        listing.id,
        listing.name,
        listing.description,
        listing.owner_id,
        typeof listing.location === 'string'
          ? listing.location
          : listing.location
          ? JSON.stringify(listing.location)
          : null,
        listing.category,
        Array.isArray(listing.tags) ? JSON.stringify(listing.tags) : listing.tags,
        listing.created_at ?? Date.now(),
        listing.updated_at ?? Date.now(),
      ]
    );
  }

  async getListingsByOwner(ownerId: string) {
    try {
      const result = db.getAllSync('SELECT * FROM listings WHERE owner_id = ? ORDER BY created_at DESC', [
        ownerId,
      ]);

      return (result || []).map((listing: any) => ({
        ...listing,
        location:
          typeof listing.location === 'string' ? JSON.parse(listing.location) : listing.location,
        tags: typeof listing.tags === 'string' ? JSON.parse(listing.tags) : listing.tags,
      }));
    } catch (error) {
      if (isNoSuchTableError(error)) {
        await this.init();
        return this.getListingsByOwner(ownerId);
      }
      throw error;
    }
  }

  // Users/Profile cache
  async getUser(userId: string) {
    const result = db.getFirstSync('SELECT * FROM users_cache WHERE id = ?', [userId]);
    return result;
  }

  async saveUser(user: any) {
    await this.execute(
      `INSERT OR REPLACE INTO users_cache 
       (id, email, username, name, surname, avatar, role, is_anonymous, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        user.id,
        user.email,
        user.username,
        user.name,
        user.surname,
        user.avatar?.id || user.avatar,
        user.role,
        user.isAnonymous ? 1 : 0,
        new Date(user.updatedAt || Date.now()).getTime(),
      ]
    );
  }

  // Favorites
  async getFavorites(userId: string) {
    try {
      const result = db.getAllSync(
        `SELECT 
          l.*,
          f.created_at as favorited_at
        FROM favorites f
        JOIN listings l ON f.listing_id = l.id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC`,
        [userId]
      );

      return (result || []).map((listing: any) => ({
        ...listing,
        location: typeof listing.location === 'string' ? JSON.parse(listing.location) : listing.location,
        tags: typeof listing.tags === 'string' ? JSON.parse(listing.tags) : listing.tags,
      }));
    } catch (error) {
      if (isNoSuchTableError(error)) {
        await this.init();
        return this.getFavorites(userId);
      }
      throw error;
    }
  }

  async addFavorite(userId: string, listingId: string) {
    const id = `${userId}_${listingId}`;
    await this.execute(
      'INSERT OR REPLACE INTO favorites (id, user_id, listing_id, created_at, synced) VALUES (?, ?, ?, ?, 0)',
      [id, userId, listingId, Date.now()]
    );
    return id;
  }

  async removeFavorite(userId: string, listingId: string) {
    await this.execute('DELETE FROM favorites WHERE user_id = ? AND listing_id = ?', [
      userId,
      listingId,
    ]);
  }

  async saveFavorites(favorites: any[], userId: string) {
    try {
      await db.withTransactionAsync(async () => {
        // Delete existing favorites for this user
        await db.runAsync('DELETE FROM favorites WHERE user_id = ?', [userId]);

        if (favorites.length > 0) {
          // Insert new favorites
          for (const favorite of favorites) {
            await db.runAsync(
              `INSERT OR REPLACE INTO favorites (id, user_id, listing_id, created_at, synced)
               VALUES (?, ?, ?, ?, 1)`,
              [
                favorite.id ?? `${userId}_${favorite.listing?.id || favorite.listing}`,
                userId,
                favorite.listing?.id || favorite.listing,
                new Date(favorite.createdAt ?? Date.now()).getTime(),
              ]
            );
          }
        }
      });
    } catch (error) {
      console.error('SQLite saveFavorites error:', error);
      throw error;
    }
  }

  // Sync Queue
  async addToSyncQueue(item: Omit<SyncQueue, 'id' | 'createdAt' | 'retryCount'>) {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.execute(
      'INSERT INTO sync_queue (id, collection, operation, data, record_id, created_at, retry_count) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [id, item.collection, item.operation, item.data, item.recordId || null, Date.now()]
    );
    return id;
  }

  async getSyncQueue(): Promise<SyncQueue[]> {
    const result = db.getAllSync(
      'SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT 50'
    );
    // Map snake_case to camelCase
    return (result || []).map((item: any) => ({
      id: item.id,
      collection: item.collection,
      operation: item.operation,
      data: item.data,
      recordId: item.record_id, // Map snake_case to camelCase
      createdAt: item.created_at,
      retryCount: item.retry_count,
      error: item.error,
    }));
  }

  async removeSyncQueueItem(id: string) {
    await this.execute('DELETE FROM sync_queue WHERE id = ?', [id]);
  }

  async updateSyncQueueError(id: string, error: string, retryCount: number) {
    await this.execute('UPDATE sync_queue SET error = ?, retry_count = ? WHERE id = ?', [
      error,
      retryCount,
      id,
    ]);
  }

  async clearSyncQueue() {
    await this.execute('DELETE FROM sync_queue');
  }

  async clearAllData() {
    await this.execute('DELETE FROM listings');
    await this.execute('DELETE FROM users_cache');
    await this.execute('DELETE FROM pictures');
    await this.execute('DELETE FROM reviews');
    await this.execute('DELETE FROM favorites');
    await this.execute('DELETE FROM sync_queue');
  }
}

export const sqliteManager = new SQLiteManager();

