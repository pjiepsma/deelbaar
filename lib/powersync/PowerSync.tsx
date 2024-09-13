import '@azure/core-asynciterator-polyfill';
import 'react-native-polyfill-globals/auto';
import { Kysely, wrapPowerSyncWithKysely } from '@powersync/kysely-driver';
import { AbstractPowerSyncDatabase, PowerSyncDatabase } from '@powersync/react-native';
import { createContext, useContext } from 'react';

import { AppSchema, Database } from './AppSchema';

import { SupabaseConnector } from '~/lib/powersync/SupabaseConnector';

export class System {
  connector: SupabaseConnector;
  powerSync: AbstractPowerSyncDatabase;
  db: Kysely<Database>;

  constructor() {
    const powerSyncDb = new PowerSyncDatabase({
      database: {
        dbFilename: 'app.sqlite',
      },
      schema: AppSchema,
    });

    this.connector = new SupabaseConnector();
    this.powerSync = powerSyncDb;
    this.db = wrapPowerSyncWithKysely(this.powerSync);
  }

  async init() {
    await this.powerSync.init();
    await this.powerSync.connect(this.connector);
  }
}

export const system = new System();
export const SystemContext = createContext(system);
export const useSystem = () => useContext(SystemContext);
