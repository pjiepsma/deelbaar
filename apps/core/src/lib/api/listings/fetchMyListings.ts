import type { Where } from 'payload';

import type { Config } from '../../types/payload-generated';
import type { MapPlaceRecord } from '../../../features/map/map.types';
import type { MapPlaceCollection } from '../../mapPlaces/mapPlaceTaxonomy';
import { getPayloadSdk } from '../payloadSdk';

const MY_LISTINGS_LIMIT = 100;
const MAP_PLACE_COLLECTIONS: readonly MapPlaceCollection[] = ['kiosks', 'markets', 'taps'];

async function fetchOwnedCollection(
  ownerId: number | string,
  collection: MapPlaceCollection,
): Promise<MapPlaceRecord[]> {
  const sdk = getPayloadSdk();
  const where: Where = {
    and: [{ owner: { equals: ownerId } }, { deletedAt: { exists: false } }],
  };
  const result = await sdk.find({
    collection,
    where,
    limit: MY_LISTINGS_LIMIT,
    depth: 1,
    sort: '-updatedAt',
  });
  return result.docs.map((doc) => ({
    ...(doc as Config['collections'][typeof collection]),
    mapPlaceCollection: collection,
  }));
}

export async function fetchMyListings(ownerId: number | string): Promise<MapPlaceRecord[]> {
  const docsByCollection = await Promise.all(
    MAP_PLACE_COLLECTIONS.map((collection) => fetchOwnedCollection(ownerId, collection)),
  );
  return docsByCollection.flat();
}
