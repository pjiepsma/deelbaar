import type { MapPlaceCollection } from '../../mapPlaces/mapPlaceTaxonomy';
import { getPayloadSdk } from '../payloadSdk';
import type { MapPlaceRecord } from '../../../features/map/map.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function toMapPlaceRecord(
  doc: unknown,
  collection: MapPlaceCollection,
): MapPlaceRecord | null {
  if (!isRecord(doc) || typeof doc.id !== 'number') {
    return null;
  }
  return {
    ...(doc as Omit<MapPlaceRecord, 'mapPlaceCollection'>),
    mapPlaceCollection: collection,
  };
}

export async function fetchPlaceDetail(
  collection: MapPlaceCollection,
  id: number,
): Promise<MapPlaceRecord | null> {
  const sdk = getPayloadSdk();
  const doc = await sdk.findByID({
    collection,
    id,
    depth: 2,
  });
  return toMapPlaceRecord(doc, collection);
}
