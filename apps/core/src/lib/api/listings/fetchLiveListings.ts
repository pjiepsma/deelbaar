import type { MapPlaceFilterValue } from '../../../lib/mapPlaces/mapPlaceTaxonomy';
import { MAP_FETCH_LISTING_LIMIT } from '../../../features/map/map.constants';
import type { MapFetchScope } from '../../../features/map/mapFetchZone';
import { mapFilterToCollectionParam } from '../../../features/map/mapFetchZone';
import type { MapPlaceRecord } from '../../../features/map/map.types';
import { payloadClient } from '../PayloadClient';

type NearbyResponse = {
  docs: MapPlaceRecord[];
};

export type FetchLiveListingsParams = {
  center: [number, number];
  radiusMeters: number;
  scope: MapFetchScope;
  collection: MapPlaceFilterValue;
  signal?: AbortSignal;
};

export async function fetchLiveListings(params: FetchLiveListingsParams): Promise<MapPlaceRecord[]> {
  const [lng, lat] = params.center;
  const collectionParam = mapFilterToCollectionParam(params.collection);
  const response = await payloadClient.request<NearbyResponse>(
    `/listings/nearby?latitude=${lat}&longitude=${lng}&radius=${params.radiusMeters}&limit=${MAP_FETCH_LISTING_LIMIT}&scope=${params.scope}&collection=${collectionParam}`,
    { method: 'GET', signal: params.signal },
  );
  return response.docs;
}
