import type { MapPlaceFilterValue } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import {
  MAP_FETCH_REFETCH_TILE_FRACTION,
  MAP_FETCH_RADIUS_CHANGE_THRESHOLD,
  MAP_FETCH_ZONE_TILE_MULTIPLIER,
} from './map.constants';
import type { MapPlaceRecord } from './map.types';
import { haversineKm, visibleRadiusKm } from './mapViewport';

export type MapFetchScope = 'city' | 'province' | 'country';

export type MapFetchZone = {
  fetchRadiusKm: number;
  refetchThresholdKm: number;
  fetchRadiusMeters: number;
  scope: MapFetchScope;
};

export type MapFetchAnchor = {
  center: [number, number];
  zoom: number;
  fetchRadiusKm: number;
  collection: MapPlaceFilterValue;
};

const SCOPE_RADIUS_CAP_METERS: Record<MapFetchScope, number> = {
  city: 15_000,
  province: 80_000,
  country: 300_000,
};

export function resolveMapFetchScope(radiusMeters: number): MapFetchScope {
  if (radiusMeters <= SCOPE_RADIUS_CAP_METERS.city) {
    return 'city';
  }
  if (radiusMeters <= SCOPE_RADIUS_CAP_METERS.province) {
    return 'province';
  }
  return 'country';
}

export function computeMapFetchZone(
  center: [number, number],
  zoom: number,
  viewportHalfPx: number,
): MapFetchZone {
  const visibleRadius = visibleRadiusKm(zoom, center[1], viewportHalfPx);
  const fetchRadiusKm = visibleRadius * MAP_FETCH_ZONE_TILE_MULTIPLIER;
  const refetchThresholdKm = fetchRadiusKm * MAP_FETCH_REFETCH_TILE_FRACTION;
  const requestedMeters = Math.round(fetchRadiusKm * 1000);
  const scope = resolveMapFetchScope(requestedMeters);
  const fetchRadiusMeters = Math.min(requestedMeters, SCOPE_RADIUS_CAP_METERS[scope]);

  return {
    fetchRadiusKm: fetchRadiusMeters / 1000,
    refetchThresholdKm,
    fetchRadiusMeters,
    scope,
  };
}

export function shouldRefetchMapListings(
  anchor: MapFetchAnchor | null,
  center: [number, number],
  zoom: number,
  viewportHalfPx: number,
  collection: MapPlaceFilterValue,
): boolean {
  if (!anchor) {
    return true;
  }
  if (anchor.collection !== collection) {
    return true;
  }

  const zone = computeMapFetchZone(center, zoom, viewportHalfPx);
  const radiusDelta = Math.abs(zone.fetchRadiusKm - anchor.fetchRadiusKm) / anchor.fetchRadiusKm;
  if (radiusDelta > MAP_FETCH_RADIUS_CHANGE_THRESHOLD) {
    return true;
  }

  return haversineKm(anchor.center, center) > zone.refetchThresholdKm;
}

export function mapPlaceRecordKey(doc: MapPlaceRecord): string | null {
  if (doc.id === undefined || !doc.mapPlaceCollection) {
    return null;
  }
  return `${doc.mapPlaceCollection}-${String(doc.id)}`;
}

function resolveRecordLngLat(doc: MapPlaceRecord): [number, number] | null {
  const coords = doc.location?.coordinates;
  if (coords && coords.length === 2) {
    const [lng, lat] = coords;
    if (typeof lng === 'number' && typeof lat === 'number' && !Number.isNaN(lng) && !Number.isNaN(lat)) {
      return [lng, lat];
    }
  }
  const lat = doc.location?.latitude;
  const lng = doc.location?.longitude;
  if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return [lng, lat];
  }
  return null;
}

export function mergeMapPlaceRecords(
  existing: MapPlaceRecord[],
  incoming: MapPlaceRecord[],
): MapPlaceRecord[] {
  const merged = new Map<string, MapPlaceRecord>();
  for (const doc of existing) {
    const key = mapPlaceRecordKey(doc);
    if (key) {
      merged.set(key, doc);
    }
  }
  for (const doc of incoming) {
    const key = mapPlaceRecordKey(doc);
    if (key) {
      merged.set(key, doc);
    }
  }
  return [...merged.values()];
}

export function pruneMapPlaceRecords(
  docs: MapPlaceRecord[],
  zones: Array<{ center: [number, number]; radiusKm: number }>,
): MapPlaceRecord[] {
  if (zones.length === 0) {
    return docs;
  }
  return docs.filter((doc) => {
    const lngLat = resolveRecordLngLat(doc);
    if (!lngLat) {
      return false;
    }
    return zones.some((zone) => haversineKm(zone.center, lngLat) <= zone.radiusKm);
  });
}

export function mapFilterToCollectionParam(filter: MapPlaceFilterValue): string {
  return filter === 'All' ? 'all' : filter;
}
