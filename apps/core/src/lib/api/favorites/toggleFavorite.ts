import type { MapPlaceCollection } from '../../mapPlaces/mapPlaceTaxonomy';
import type { AuthUser } from '../auth/authClient';
import { payloadClient } from '../PayloadClient';
import { fetchCurrentUserFull } from '../users/fetchCurrentUserFull';
import {
  favoritePlaceKey,
  favoriteRowsFromUser,
  type FavoriteRowForPatch,
} from './favoriteKeys';

export async function toggleFavoritePlace(params: {
  userId: AuthUser['id'];
  collection: MapPlaceCollection;
  placeId: number;
}): Promise<{ loved: boolean }> {
  const full = await fetchCurrentUserFull(0);
  if (!full) {
    throw new Error('Could not load favorites for the current user.');
  }

  const existing = favoriteRowsFromUser(full);
  const key = favoritePlaceKey(params.collection, params.placeId);
  const alreadyLoved = existing.some(
    (row) => favoritePlaceKey(row.place.relationTo, row.place.value) === key,
  );

  const nextFavorites: FavoriteRowForPatch[] = alreadyLoved
    ? existing.filter((row) => favoritePlaceKey(row.place.relationTo, row.place.value) !== key)
    : [
        ...existing,
        {
          place: {
            relationTo: params.collection,
            value: params.placeId,
          },
        },
      ];

  await payloadClient.request(`/users/${params.userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ favorites: nextFavorites }),
  });

  return { loved: !alreadyLoved };
}
