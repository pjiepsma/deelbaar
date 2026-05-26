import { useEffect } from 'react';

import type { DiscoveryAreaContextValue } from '../../context/DiscoveryAreaContext';
import { resolveDeviceLngLat } from '../../lib/location/resolveDeviceLngLat';
import { isDefaultMapCenter } from './mapCenter';

export function useInitialMapCenterFromDevice(
  referenceLngLat: [number, number],
  setReferenceLngLat: DiscoveryAreaContextValue['setReferenceLngLat'],
): void {
  useEffect(() => {
    if (!isDefaultMapCenter(referenceLngLat)) {
      return;
    }

    void (async () => {
      const lngLat = await resolveDeviceLngLat();
      if (lngLat) {
        setReferenceLngLat(lngLat);
      }
    })();
  }, [referenceLngLat, setReferenceLngLat]);
}
