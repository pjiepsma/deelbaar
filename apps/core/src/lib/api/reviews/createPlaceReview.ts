import type { MapPlaceCollection } from '../../mapPlaces/mapPlaceTaxonomy';
import type { AuthUser } from '../auth/authClient';
import { getPayloadSdk } from '../payloadSdk';

const MIN_RATING = 1;
const MAX_RATING = 5;
const MIN_DESCRIPTION_LENGTH = 3;

export async function createPlaceReview(params: {
  userId: AuthUser['id'];
  collection: MapPlaceCollection;
  placeId: number;
  rating: number;
  description: string;
}): Promise<void> {
  const description = params.description.trim();
  if (description.length < MIN_DESCRIPTION_LENGTH) {
    throw new Error('Review description is too short.');
  }
  if (
    !Number.isInteger(params.rating) ||
    params.rating < MIN_RATING ||
    params.rating > MAX_RATING
  ) {
    throw new Error('Review rating must be an integer from 1 to 5.');
  }

  const createdBy =
    typeof params.userId === 'number' ? params.userId : Number(params.userId);
  if (!Number.isFinite(createdBy)) {
    throw new Error('Review author id is invalid.');
  }

  const sdk = getPayloadSdk();
  await sdk.create({
    collection: 'reviews',
    data: {
      rating: params.rating,
      description,
      created_by: createdBy,
      place: {
        relationTo: params.collection,
        value: params.placeId,
      },
      status: 'published',
    },
  });
}
