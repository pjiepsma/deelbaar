import type { User } from '../../types/payload-generated';
import type { MapPlaceCollection } from '../../mapPlaces/mapPlaceTaxonomy';

export type FavoritePlaceRef = {
  relationTo: MapPlaceCollection;
  value: number;
};

export type FavoriteRowForPatch = {
  id?: string;
  place: FavoritePlaceRef;
};

const PLACE_COLLECTIONS: ReadonlyArray<MapPlaceCollection> = ['kiosks', 'markets', 'taps'];

function isMapPlaceCollection(value: string): value is MapPlaceCollection {
  return (PLACE_COLLECTIONS as readonly string[]).includes(value);
}

export function favoritePlaceKey(collection: MapPlaceCollection, placeId: number): string {
  return `${collection}:${placeId}`;
}

function readPlaceId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id: unknown }).id;
    if (typeof id === 'number' && Number.isFinite(id)) {
      return id;
    }
    if (typeof id === 'string' && id.trim().length > 0) {
      const parsed = Number(id);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  return null;
}

/** Flatten user.favorites into patch-safe `{ place: { relationTo, value } }` rows. */
export function favoriteRowsFromUser(user: User): FavoriteRowForPatch[] {
  const rows = user.favorites;
  if (!rows || rows.length === 0) {
    return [];
  }

  const out: FavoriteRowForPatch[] = [];
  for (const row of rows) {
    const place = row.place;
    if (!place || typeof place !== 'object') {
      continue;
    }
    if (!('relationTo' in place) || typeof place.relationTo !== 'string') {
      continue;
    }
    if (!isMapPlaceCollection(place.relationTo)) {
      continue;
    }
    const placeId = readPlaceId('value' in place ? place.value : null);
    if (placeId === null) {
      continue;
    }
    const next: FavoriteRowForPatch = {
      place: { relationTo: place.relationTo, value: placeId },
    };
    if (typeof row.id === 'string' && row.id.length > 0) {
      next.id = row.id;
    }
    out.push(next);
  }
  return out;
}

export function favoriteKeySetFromUser(user: User): Set<string> {
  const keys = new Set<string>();
  for (const row of favoriteRowsFromUser(user)) {
    keys.add(favoritePlaceKey(row.place.relationTo, row.place.value));
  }
  return keys;
}

export function isPlaceInFavorites(
  user: User,
  collection: MapPlaceCollection,
  placeId: number,
): boolean {
  return favoriteKeySetFromUser(user).has(favoritePlaceKey(collection, placeId));
}
