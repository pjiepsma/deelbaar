import type { MapPlaceCollection } from '../../lib/mapPlaces/mapPlaceTaxonomy';

export type PlaceInteractionContract = {
  canInteract: boolean;
  canOpenDetails: boolean;
  canFavorite: boolean;
  canFollow: boolean;
  canRequest: boolean;
  canReceiveNotifications: boolean;
  reason: 'ok' | 'auth_required' | 'outside_unlocked_scope';
  maxUnlockedScope: 'city' | 'province' | 'country' | 'world' | null;
  requiredScope: 'city' | 'province' | 'country' | 'world' | null;
};

export type MapPlaceRecord = {
  id: number;
  name: string;
  description: string;
  mapPlaceCollection: MapPlaceCollection;
  publishStatus?: 'draft' | 'live';
  kioskSubtype?: string | null;
  marketSubtype?: string | null;
  tapSubtype?: string | null;
  location?: {
    coordinates?: [number, number] | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  pictures?: Array<{
    status?: 'pending' | 'approved' | 'rejected' | string;
    photo?:
      | string
      | number
      | {
          url?: string | null;
          thumbnailURL?: string | null;
        };
  }> | null;
  interaction?: PlaceInteractionContract;
};

export type MapListingCard = {
  id?: number | string;
  mapPlaceCollection: MapPlaceCollection;
  title: string;
  kindLabel: string;
  distanceKm?: number;
  rating?: number;
  reviews?: number;
  imageUrl?: string;
  loved?: boolean;
  interaction?: PlaceInteractionContract;
};

/** Skeleton row before listing payload is available â€” must not be treated as a real card. */
export type MapListingCardPlaceholder = Record<string, never>;

export function isMapListingCard(row: MapListingCard | MapListingCardPlaceholder): row is MapListingCard {
  return 'title' in row && typeof row.title === 'string';
}
