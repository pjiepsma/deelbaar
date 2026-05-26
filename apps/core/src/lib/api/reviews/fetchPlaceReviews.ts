import type { Where } from 'payload';

import type { Review } from '../../types/payload-generated';
import type { MapPlaceCollection } from '../../mapPlaces/mapPlaceTaxonomy';
import { getPayloadSdk } from '../payloadSdk';

const PLACE_REVIEWS_LIMIT = 50;

export async function fetchPlaceReviews(
  collection: MapPlaceCollection,
  placeId: number,
): Promise<Review[]> {
  const sdk = getPayloadSdk();
  const where: Where = {
    and: [
      { status: { equals: 'published' } },
      { 'place.relationTo': { equals: collection } },
      { 'place.value': { equals: placeId } },
    ],
  };
  const result = await sdk.find({
    collection: 'reviews',
    where,
    depth: 2,
    sort: '-createdAt',
    limit: PLACE_REVIEWS_LIMIT,
  });
  return result.docs;
}
