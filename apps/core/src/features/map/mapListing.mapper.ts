import type { Listing as PayloadListing } from '../../../lib/types/payload-generated';

import { MAP_CENTER } from './map.constants';
import type { MapListingCard } from './map.types';

const EARTH_RADIUS_KM = 6371;
const DEG_TO_RAD = Math.PI / 180;

const PAYLOAD_CATEGORY_LABEL: Record<PayloadListing['category'], string> = {
  book: 'Books',
  food: 'Food',
  hygiene: 'Hygiene',
  community: 'Community',
  farm: 'Farm',
  other: 'Other',
};

function resolveMediaUrl(serverOrigin: string, url?: string | null): string | undefined {
  if (!url) {
    return undefined;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const base = serverOrigin.replace(/\/+$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const lat1Rad = lat1 * DEG_TO_RAD;
  const lat2Rad = lat2 * DEG_TO_RAD;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}

function pickImageUrl(listing: PayloadListing, serverOrigin: string): string | undefined {
  const row = listing.pictures?.find((p) => p.status === 'approved') ?? listing.pictures?.[0];
  if (!row) {
    return undefined;
  }
  const photo = row.photo;
  if (typeof photo === 'string') {
    return undefined;
  }
  return resolveMediaUrl(serverOrigin, photo.url ?? photo.thumbnailURL);
}

export function mapPayloadListingToMapCard(
  listing: PayloadListing,
  serverOrigin: string,
  referenceLngLat: [number, number],
): MapListingCard {
  const coords = listing.location?.coordinates;
  const distanceKm =
    coords && coords.length === 2 ? haversineKm(referenceLngLat, coords) : undefined;

  return {
    id: listing.id,
    title: listing.name,
    categorySlug: listing.category,
    categoryLabel: PAYLOAD_CATEGORY_LABEL[listing.category],
    distanceKm,
    imageUrl: pickImageUrl(listing, serverOrigin),
    loved: false,
  };
}

export function mapPayloadListingsToMapCards(
  listings: PayloadListing[],
  serverOrigin: string,
): MapListingCard[] {
  return listings.map((listing) => mapPayloadListingToMapCard(listing, serverOrigin, MAP_CENTER));
}
