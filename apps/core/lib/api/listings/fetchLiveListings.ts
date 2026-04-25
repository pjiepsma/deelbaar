import type { Where } from 'payload';

import type { Listing } from '../../types/payload-generated';
import { getPayloadSdk } from '../payloadSdk';

const LIVE_LISTINGS_LIMIT = 50;

const LIVE_ONLY_WHERE = {
  publishStatus: { equals: 'live' },
} satisfies Where;

export async function fetchLiveListings(): Promise<Listing[]> {
  const sdk = getPayloadSdk();
  const result = await sdk.find({
    collection: 'listings',
    where: LIVE_ONLY_WHERE,
    limit: LIVE_LISTINGS_LIMIT,
    depth: 1,
    sort: '-updatedAt',
  });
  return result.docs;
}
