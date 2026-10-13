import type { Where } from 'payload';

import { fetchCurrentUserFull } from '../users/fetchCurrentUserFull';
import { getPayloadSdk } from '../payloadSdk';

export async function fetchFavoritesCount(): Promise<number> {
  const user = await fetchCurrentUserFull(0);
  if (!user) {
    throw new Error('fetchFavoritesCount requires a signed-in user');
  }
  if (!user.favorites) {
    return 0;
  }
  return user.favorites.length;
}

export async function fetchMyReviewsCount(userId: number | string): Promise<number> {
  const sdk = getPayloadSdk();
  const where: Where = {
    created_by: { equals: userId },
  };
  const result = await sdk.find({
    collection: 'reviews',
    where,
    limit: 0,
    depth: 0,
  });
  return result.totalDocs;
}
