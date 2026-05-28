import { MAP_CENTER, MAP_MAX_ZOOM, MAP_MIN_ZOOM } from './map.constants';
export const MAP_CENTER_EPSILON = 0.0001;

export function coordinatesNear(
  a: [number, number],
  b: [number, number],
  epsilon = MAP_CENTER_EPSILON,
): boolean {
  return Math.abs(a[0] - b[0]) < epsilon && Math.abs(a[1] - b[1]) < epsilon;
}

export function isDefaultMapCenter(lngLat: [number, number]): boolean {
  return coordinatesNear(lngLat, MAP_CENTER);
}

export function normalizeMapZoom(zoom: number | undefined, fallback: number): number {
  if (typeof zoom !== 'number' || Number.isNaN(zoom)) {
    return fallback;
  }
  return Math.min(MAP_MAX_ZOOM, Math.max(MAP_MIN_ZOOM, zoom));
}
