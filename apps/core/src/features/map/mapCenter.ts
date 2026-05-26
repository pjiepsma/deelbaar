import { MAP_CENTER } from './map.constants';

export function isDefaultMapCenter(lngLat: [number, number]): boolean {
  return lngLat[0] === MAP_CENTER[0] && lngLat[1] === MAP_CENTER[1];
}
