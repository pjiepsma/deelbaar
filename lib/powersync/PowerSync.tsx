import '@azure/core-asynciterator-polyfill';
import 'react-native-polyfill-globals/auto';
import { AttachmentRecord } from '@powersync/attachments';
import { Kysely, wrapPowerSyncWithKysely } from '@powersync/kysely-driver';
import { AbstractPowerSyncDatabase, PowerSyncDatabase } from '@powersync/react-native';
import { createContext, useContext } from 'react';

import { AppSchema, Database } from './AppSchema';

import { AppConfig } from '~/lib/powersync/AppConfig';
import { PhotoAttachmentQueue } from '~/lib/powersync/PhotoAttachmentQueue';
import { SupabaseConnector } from '~/lib/powersync/SupabaseConnector';
import { SupabaseStorageAdapter } from '~/lib/powersync/storage/SupabaseStorageAdapter';

export class System {
  connector: SupabaseConnector;
  powersync: AbstractPowerSyncDatabase;
  attachmentQueue: PhotoAttachmentQueue | undefined = undefined;
  storage: SupabaseStorageAdapter;
  db: Kysely<Database>;

  constructor() {
    const powerSyncDb = new PowerSyncDatabase({
      database: {
        dbFilename: 'app.sqlite',
      },
      schema: AppSchema,
    });

    this.connector = new SupabaseConnector();
    this.storage = this.connector.storage;
    this.powersync = powerSyncDb;
    this.db = wrapPowerSyncWithKysely(this.powersync);
    if (AppConfig.supabaseBucket) {
      this.attachmentQueue = new PhotoAttachmentQueue({
        powersync: this.powersync,
        storage: this.storage,
        // Use this to handle download errors where you can use the attachment
        // and/or the exception to decide if you want to retry the download
        onDownloadError: async (attachment: AttachmentRecord, exception: any) => {
          if (exception.toString() === 'StorageApiError: Object not found') {
            return { retry: false };
          }

          return { retry: true };
        },
      });
    }
  }

  async init() {
    await this.powersync.init();
    await this.powersync.connect(this.connector);

    if (this.attachmentQueue) {
      await this.attachmentQueue.init();
    }
  }
}

export const system = new System();
export const SystemContext = createContext(system);
export const useSystem = () => useContext(SystemContext);
