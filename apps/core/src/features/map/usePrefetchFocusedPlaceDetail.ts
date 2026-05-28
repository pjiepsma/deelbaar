import { Image } from 'react-native';
import { useEffect, useRef } from 'react';

import { useLocale } from '../../context/LocaleContext';
import { prefetchPlaceDetail } from '../../lib/listings/placeDetailPrefetchCache';
import { MAP_FOCUS_PREFETCH_DEBOUNCE_MS } from './map.constants';
import { listingMarkerKey } from './mapViewport';
import type { MapListingCard } from './map.types';

type Params = {
  focusedListing: MapListingCard | null;
  enabled: boolean;
};

function resolveListingId(listing: MapListingCard): number | null {
  const id = typeof listing.id === 'number' ? listing.id : Number(listing.id);
  if (Number.isNaN(id)) {
    return null;
  }
  return id;
}

export function usePrefetchFocusedPlaceDetail({ focusedListing, enabled }: Params): void {
  const { locale } = useLocale();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverOrigin = process.env.EXPO_PUBLIC_PAYLOAD_SERVER_URL;
  const focusKey = focusedListing ? listingMarkerKey(focusedListing) : null;

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!enabled || !focusedListing || !focusKey || !serverOrigin) {
      return;
    }

    const listing = focusedListing;
    debounceRef.current = setTimeout(() => {
      if (listing.imageUrl) {
        void Image.prefetch(listing.imageUrl).catch(() => undefined);
      }

      const id = resolveListingId(listing);
      if (id === null) {
        return;
      }

      void prefetchPlaceDetail({
        collection: listing.mapPlaceCollection,
        id,
        locale,
        serverOrigin,
      });
    }, MAP_FOCUS_PREFETCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [enabled, focusKey, focusedListing, locale, serverOrigin]);
}
