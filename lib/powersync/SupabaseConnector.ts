import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  UpdateType,
} from '@powersync/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';

import { AppConfig } from '~/lib/powersync/AppConfig';
import { SupabaseStorageAdapter } from '~/lib/powersync/storage/SupabaseStorageAdapter';

export const supabase = createClient(AppConfig.SUPABASE_URL, AppConfig.SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

const FATAL_RESPONSE_CODES = [new RegExp('^22...$'), new RegExp('^23...$'), new RegExp('^42501$')];

export class SupabaseConnector implements PowerSyncBackendConnector {
  client: SupabaseClient;
  storage: SupabaseStorageAdapter;

  constructor() {
    this.client = supabase;
    this.storage = new SupabaseStorageAdapter({ client: this.client });
  }

  async login(username: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: username,
      password,
    });

    if (error) {
      throw error;
    }
    return data;
  }

  async anonymously() {
    const { data, error } = await this.client.auth.signInAnonymously();

    if (error) {
      throw error;
    }
    return data;
  }

  async fetchCredentials() {
    const {
      data: { session },
      error,
    } = await this.client.auth.getSession();
    if (!session || error) {
      throw new Error(`Could not fetch Supabase credentials: ${error}`);
    }

    return {
      client: this.client,
      endpoint: AppConfig.POWERSYNC_URL,
      token: session.access_token ?? '',
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
      userID: session.user.id,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) {
      return;
    }

    let lastOp: CrudEntry | null = null;
    try {
      // Note: If transactional consistency is important, use database functions
      // or edge functions to process the entire transaction in a single call.
      for (const op of transaction.crud) {
        lastOp = op;
        const table = this.client.from(op.table);
        let result: any = null;
        switch (op.op) {
          case UpdateType.PUT:
            // eslint-disable-next-line no-case-declarations
            const record = { ...op.opData, id: op.id };
            result = await table.upsert(record);
            break;
          case UpdateType.PATCH:
            result = await table.update(op.opData).eq('id', op.id);
            break;
          case UpdateType.DELETE:
            result = await table.delete().eq('id', op.id);
            break;
        }

        if (result.error) {
          throw new Error(`Could not ${op.op} data to Supabase error: ${JSON.stringify(result)}`);
        }
      }

      await transaction.complete();
    } catch (ex: any) {
      console.debug(ex);
      if (typeof ex.code == 'string' && FATAL_RESPONSE_CODES.some((regex) => regex.test(ex.code))) {
        /**
         * Instead of blocking the queue with these errors,
         * discard the (rest of the) transaction.
         *
         * Note that these errors typically indicate a bug in the application.
         * If protecting against data loss is important, save the failing records
         * elsewhere instead of discarding, and/or notify the user.
         */
        console.error(`Data upload error - discarding ${lastOp}`, ex);
        await transaction.complete();
      } else {
        // Error may be retryable - e.g. network error or temporary server error.
        // Throwing an error here causes this call to be retried after a delay.
        throw ex;
      }
    }
  }
}
