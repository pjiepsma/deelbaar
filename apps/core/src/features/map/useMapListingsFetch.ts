import { useCallback, useEffect, useRef, useState } from 'react';

import type { MapPlaceFilterValue } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import { fetchLiveListings } from '../../lib/api/listings/fetchLiveListings';
import {
  computeMapFetchZone,
  mergeMapPlaceRecords,
  pruneMapPlaceRecords,
  shouldRefetchMapListings,
  type MapFetchAnchor,
} from './mapFetchZone';
import type { MapPlaceRecord } from './map.types';

type FetchMode = 'foreground' | 'background';

type Params = {
  center: [number, number];
  zoom: number;
  viewportHalfPx: number;
  collectionFilter: MapPlaceFilterValue;
  enabled: boolean;
  unavailableMessage: string;
};

type RequestFetchOptions = {
  center: [number, number];
  zoom: number;
  mode: FetchMode;
  collectionFilter: MapPlaceFilterValue;
};

export function useMapListingsFetch({
  center,
  zoom,
  viewportHalfPx,
  collectionFilter,
  enabled,
  unavailableMessage,
}: Params) {
  const [rawListings, setRawListings] = useState<MapPlaceRecord[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchAnchorRef = useRef<MapFetchAnchor | null>(null);
  const previousAnchorRef = useRef<MapFetchAnchor | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inFlightKeyRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  const runFetch = useCallback(
    async ({ center: fetchCenter, zoom: fetchZoom, mode, collectionFilter: collection }: RequestFetchOptions) => {
      if (!enabled) {
        return;
      }

      const zone = computeMapFetchZone(fetchCenter, fetchZoom, viewportHalfPx);
      const requestKey = `${collection}:${zone.scope}:${zone.fetchRadiusMeters}:${fetchCenter[0].toFixed(3)},${fetchCenter[1].toFixed(3)}`;
      if (inFlightKeyRef.current === requestKey) {
        return;
      }

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      inFlightKeyRef.current = requestKey;

      const showForegroundLoading = mode === 'foreground' && !hasLoadedRef.current;
      if (showForegroundLoading) {
        setIsFetching(true);
      }
      if (mode === 'foreground') {
        setFetchError(null);
      }

      try {
        const docs = await fetchLiveListings({
          center: fetchCenter,
          radiusMeters: zone.fetchRadiusMeters,
          scope: zone.scope,
          collection,
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        const nextAnchor: MapFetchAnchor = {
          center: fetchCenter,
          zoom: fetchZoom,
          fetchRadiusKm: zone.fetchRadiusKm,
          collection,
        };

        setRawListings((previous) => {
          const merged = mergeMapPlaceRecords(previous, docs);
          const zones = [
            { center: nextAnchor.center, radiusKm: nextAnchor.fetchRadiusKm },
            ...(previousAnchorRef.current
              ? [{ center: previousAnchorRef.current.center, radiusKm: previousAnchorRef.current.fetchRadiusKm }]
              : []),
          ];
          return pruneMapPlaceRecords(merged, zones);
        });

        previousAnchorRef.current = fetchAnchorRef.current;
        fetchAnchorRef.current = nextAnchor;
        hasLoadedRef.current = true;
        setFetchError(null);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        if (mode === 'foreground' && !hasLoadedRef.current) {
          setFetchError(unavailableMessage);
          setRawListings([]);
        }
      } finally {
        if (inFlightKeyRef.current === requestKey) {
          inFlightKeyRef.current = null;
        }
        if (showForegroundLoading) {
          setIsFetching(false);
        }
      }
    },
    [enabled, unavailableMessage, viewportHalfPx],
  );

  const requestFetch = useCallback(
    (options: RequestFetchOptions) => {
      void runFetch(options);
    },
    [runFetch],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    requestFetch({
      center,
      zoom,
      mode: 'foreground',
      collectionFilter,
    });
  }, [collectionFilter, enabled]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const maybeRefetchForViewport = useCallback(
    (nextCenter: [number, number], nextZoom: number) => {
      if (!enabled) {
        return;
      }
      if (
        !shouldRefetchMapListings(
          fetchAnchorRef.current,
          nextCenter,
          nextZoom,
          viewportHalfPx,
          collectionFilter,
        )
      ) {
        return;
      }
      requestFetch({
        center: nextCenter,
        zoom: nextZoom,
        mode: hasLoadedRef.current ? 'background' : 'foreground',
        collectionFilter,
      });
    },
    [collectionFilter, enabled, requestFetch, viewportHalfPx],
  );

  return {
    rawListings,
    isFetching,
    fetchError,
    requestFetch,
    maybeRefetchForViewport,
  };
}
