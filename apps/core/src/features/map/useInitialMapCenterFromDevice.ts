import { useEffect } from 'react';

import type { DiscoveryAreaContextValue } from '../../context/DiscoveryAreaContext';
import { resolveDeviceLngLat } from '../../lib/location/resolveDeviceLngLat';

export function useInitialMapCenterFromDevice(
  setReferenceLngLat: DiscoveryAreaContextValue['setReferenceLngLat'],
  onResolved: (lngLat: [number, number] | null) => void,
): void {
  useEffect(() => {
    void (async () => {
      const lngLat = await resolveDeviceLngLat();
      onResolved(lngLat);
      if (lngLat) {
        setReferenceLngLat(lngLat);
      }
    })();
  }, [onResolved, setReferenceLngLat]);
}
