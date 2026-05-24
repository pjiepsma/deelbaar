import { payloadClient } from '../PayloadClient';
import type { MapPlaceRecord } from '../../../features/map/map.types';

type NearbyResponse = {
  docs: MapPlaceRecord[];
};

const WORLD_RADIUS_METERS = 20_000_000;
const WORLD_FETCH_LIMIT = 1000;

export async function fetchLiveListings(): Promise<MapPlaceRecord[]> {
  const response = await payloadClient.request<NearbyResponse>(
    `/listings/nearby?latitude=52.3676&longitude=4.9041&radius=${WORLD_RADIUS_METERS}&limit=${WORLD_FETCH_LIMIT}&scope=world&collection=all`,
    { method: 'GET' },
  );
  return response.docs;
}
