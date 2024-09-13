import { PowerSyncContext } from '@powersync/react-native';
import { ReactNode, useMemo } from 'react';

import { useSystem } from '~/lib/powersync/PowerSync';

export const PowerSyncProvider = ({ children }: { children: ReactNode }) => {
  const { powerSync } = useSystem();

  const db = useMemo(() => {
    return powerSync;
  }, []);

  return <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>;
};
