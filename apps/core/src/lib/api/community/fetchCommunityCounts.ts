import type { Where } from 'payload';

import type { MapPlaceCollection } from '../../mapPlaces/mapPlaceTaxonomy';
import { getPayloadSdk } from '../payloadSdk';

const LIVE_LISTING_COLLECTIONS: readonly MapPlaceCollection[] = ['kiosks', 'markets', 'taps'];

const LIVE_LISTING_WHERE: Where = {
  and: [{ publishStatus: { equals: 'live' } }, { deletedAt: { exists: false } }],
};

async function countLiveInCollection(collection: MapPlaceCollection): Promise<number> {
  const sdk = getPayloadSdk();
  const result = await sdk.find({
    collection,
    where: LIVE_LISTING_WHERE,
    limit: 0,
    depth: 0,
  });
  return result.totalDocs;
}

export async function fetchCommunityCounts(): Promise<{ liveListings: number }> {
  const counts = await Promise.all(LIVE_LISTING_COLLECTIONS.map(countLiveInCollection));
  const liveListings = counts.reduce((sum, count) => sum + count, 0);
  return { liveListings };
}
