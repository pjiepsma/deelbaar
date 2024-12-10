import { AttachmentRecord } from "@powersync/attachments";
import {
  AbstractPowerSyncDatabase,
  PowerSyncDatabase,
} from "@powersync/react-native";
import { createContext, useContext } from "react";

import { AppSchema } from "./AppSchema";

import { AppConfig } from "~/lib/supabase/AppConfig";
import { PhotoAttachmentQueue } from "~/lib/powersync/PhotoAttachmentQueue";
import { SupabaseConnector } from "~/lib/supabase/SupabaseConnector";
import { SupabaseStorageAdapter } from "~/lib/storage/SupabaseStorageAdapter";
import { KVStorage } from "~/lib/storage/KVStorage";

export class System {
  kvStorage: KVStorage;
  connector: SupabaseConnector;
  powersync: any;
  attachmentQueue: PhotoAttachmentQueue | undefined = undefined;
  storage: SupabaseStorageAdapter;

  constructor() {
    this.kvStorage = new KVStorage();
    this.connector = new SupabaseConnector(this);
    this.storage = this.connector.storage;
    this.powersync = new PowerSyncDatabase({
      schema: AppSchema,
      database: {
        dbFilename: "sqlite.db",
      },
    });

    if (AppConfig.SUPABASE_BUCKET) {
      this.attachmentQueue = new PhotoAttachmentQueue({
        powersync: this.powersync,
        storage: this.storage,
        // Use this to handle download errors where you can use the attachment
        // and/or the exception to decide if you want to retry the download
        onDownloadError: async (
          attachment: AttachmentRecord,
          exception: any,
        ) => {
          if (exception.toString() === "StorageApiError: Object not found") {
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
