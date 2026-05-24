import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import { MAP_CENTER } from '../features/map/map.constants';

export type DiscoveryAreaContextValue = {
  referenceLngLat: [number, number];
  setReferenceLngLat: (next: [number, number]) => void;
};

const DiscoveryAreaContext = createContext<DiscoveryAreaContextValue | null>(null);

export function DiscoveryAreaProvider({ children }: PropsWithChildren) {
  const [referenceLngLat, setReferenceLngLat] = useState<[number, number]>(MAP_CENTER);
  const value = useMemo(
    () => ({
      referenceLngLat,
      setReferenceLngLat,
    }),
    [referenceLngLat],
  );
  return <DiscoveryAreaContext.Provider value={value}>{children}</DiscoveryAreaContext.Provider>;
}

export function useDiscoveryArea(): DiscoveryAreaContextValue {
  const ctx = useContext(DiscoveryAreaContext);
  if (!ctx) {
    throw new Error('useDiscoveryArea must be used within DiscoveryAreaProvider');
  }
  return ctx;
}
