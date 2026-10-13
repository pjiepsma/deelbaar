import type { MapListingCard } from './map.types';

const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_M = EARTH_RADIUS_KM * 1000;
const DEG_TO_RAD = Math.PI / 180;
const WEB_MERCATOR_CIRCUMFERENCE_M = 40075016.686;
const TILE_SIZE = 256;

export type MapViewportSizePx = {
  halfWidthPx: number;
  halfHeightPx: number;
};

export function haversineKm(a: [number, number], b: [number, number]): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const lat1Rad = lat1 * DEG_TO_RAD;
  const lat2Rad = lat2 * DEG_TO_RAD;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}

export function metersPerPixelAtZoom(zoom: number, latitude: number): number {
  return (WEB_MERCATOR_CIRCUMFERENCE_M * Math.cos(latitude * DEG_TO_RAD)) / (TILE_SIZE * 2 ** zoom);
}

/** Prefetch radius from longer screen half (legacy circular fetch buffer). */
export function visibleRadiusKm(zoom: number, latitude: number, viewportHalfPx: number): number {
  return (metersPerPixelAtZoom(zoom, latitude) * viewportHalfPx) / 1000;
}

function offsetMetersFromCenter(
  listingLngLat: [number, number],
  mapCenterLngLat: [number, number],
): { eastM: number; northM: number } {
  const [lng, lat] = listingLngLat;
  const [centerLng, centerLat] = mapCenterLngLat;
  const northM = (lat - centerLat) * DEG_TO_RAD * EARTH_RADIUS_M;
  const eastM = (lng - centerLng) * DEG_TO_RAD * EARTH_RADIUS_M * Math.cos(centerLat * DEG_TO_RAD);
  return { eastM, northM };
}

/** True when listing sits inside the visible map rectangle (+ margin past the edges). */
export function isListingInMapView(
  listingLngLat: [number, number],
  mapCenterLngLat: [number, number],
  zoom: number,
  viewport: MapViewportSizePx,
  inViewMargin: number,
): boolean {
  const mpp = metersPerPixelAtZoom(zoom, mapCenterLngLat[1]);
  const halfWidthM = mpp * viewport.halfWidthPx * inViewMargin;
  const halfHeightM = mpp * viewport.halfHeightPx * inViewMargin;
  const { eastM, northM } = offsetMetersFromCenter(listingLngLat, mapCenterLngLat);
  return Math.abs(eastM) <= halfWidthM && Math.abs(northM) <= halfHeightM;
}

export function cameraCenterTowardListing(
  mapCenterLngLat: [number, number],
  listingLngLat: [number, number],
  strength: number,
): [number, number] {
  return [
    mapCenterLngLat[0] + (listingLngLat[0] - mapCenterLngLat[0]) * strength,
    mapCenterLngLat[1] + (listingLngLat[1] - mapCenterLngLat[1]) * strength,
  ];
}

export function filterListingsInMapViewport(
  listings: MapListingCard[],
  mapCenterLngLat: [number, number],
  zoom: number,
  viewport: MapViewportSizePx,
  viewportMargin: number,
): MapListingCard[] {
  return listings.filter((item) => {
    if (!item.lngLat) {
      return false;
    }
    return isListingInMapView(item.lngLat, mapCenterLngLat, zoom, viewport, viewportMargin);
  });
}

export function listingMarkerKey(listing: { id?: number | string; mapPlaceCollection: string }): string | null {
  if (listing.id === undefined) {
    return null;
  }
  return `${listing.mapPlaceCollection}-${String(listing.id)}`;
}
