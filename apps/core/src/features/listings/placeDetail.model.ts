import type { MapListingCard, MapPlaceRecord } from '../map/map.types';
import type { MapPlaceCollection } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import type { TranslateFn } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import { buildMapPlaceKindLabel } from '../../lib/mapPlaces/mapPlaceTaxonomy';

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

export function collectApprovedPictureUrls(place: MapPlaceRecord, serverOrigin: string): string[] {
  const rows = place.pictures ?? [];
  const urls: string[] = [];
  for (const row of rows) {
    if (row.status && row.status !== 'approved') {
      continue;
    }
    const photo = row.photo;
    if (!photo || typeof photo === 'string' || typeof photo === 'number') {
      continue;
    }
    const url = resolveMediaUrl(serverOrigin, photo.url ?? photo.thumbnailURL);
    if (url) {
      urls.push(url);
    }
  }
  if (urls.length === 0) {
    for (const row of rows) {
      const photo = row.photo;
      if (!photo || typeof photo === 'string' || typeof photo === 'number') {
        continue;
      }
      const url = resolveMediaUrl(serverOrigin, photo.url ?? photo.thumbnailURL);
      if (url) {
        urls.push(url);
      }
    }
  }
  return urls;
}

export function resolveHeroPhotoUrls(
  place: MapPlaceRecord,
  serverOrigin: string,
  carouselImageUrl?: string,
): string[] {
  const fromPictures = collectApprovedPictureUrls(place, serverOrigin);
  if (fromPictures.length > 0) {
    return fromPictures;
  }
  if (carouselImageUrl) {
    return [carouselImageUrl];
  }
  return [];
}

function resolveSubtypeKey(place: {
  mapPlaceCollection: MapPlaceCollection;
  kioskSubtype?: string | null;
  marketSubtype?: string | null;
  tapSubtype?: string | null;
}): string {
  if (place.mapPlaceCollection === 'kiosks') {
    const subtype = place.kioskSubtype;
    if (!subtype) {
      throw new Error('kioskSubtype is required for kiosks');
    }
    return subtype;
  }
  if (place.mapPlaceCollection === 'markets') {
    const subtype = place.marketSubtype;
    if (!subtype) {
      throw new Error('marketSubtype is required for markets');
    }
    return subtype;
  }
  const subtype = place.tapSubtype;
  if (!subtype) {
    throw new Error('tapSubtype is required for taps');
  }
  return subtype;
}

export function buildPlaceSubtypeLabel(
  place: {
    mapPlaceCollection: MapPlaceCollection;
    kioskSubtype?: string | null;
    marketSubtype?: string | null;
    tapSubtype?: string | null;
  },
  t: TranslateFn,
): string {
  return t(`placeKind.subtype.${resolveSubtypeKey(place)}`);
}

export function resolvePlaceLngLat(place: MapPlaceRecord): [number, number] | null {
  const coords = place.location?.coordinates;
  if (coords && coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    return coords;
  }
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return [lng, lat];
  }
  return null;
}

export function formatPlaceAddress(place: MapPlaceRecord): string | null {
  const direct = place.location?.address?.trim();
  if (direct) {
    return direct;
  }
  const parts = [
    place.location?.street,
    place.location?.houseNumber,
    place.location?.zipCode,
    place.location?.city,
  ]
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter((p) => p.length > 0);
  if (parts.length === 0) {
    return null;
  }
  return parts.join(', ');
}

export type PlaceDetailInfoCell = {
  labelKey: string;
  value: string;
};

export function buildPlaceDetailInfoGrid(
  place: MapPlaceRecord,
  card: MapListingCard,
  t: TranslateFn,
  options?: { omitDistance?: boolean },
): PlaceDetailInfoCell[] {
  const cells: PlaceDetailInfoCell[] = [];

  const openingHours = place.facilities?.openingHours?.trim();
  if (openingHours) {
    cells.push({ labelKey: 'listing.openingHours', value: openingHours });
  }

  if (!options?.omitDistance && card.distanceKm !== undefined) {
    cells.push({
      labelKey: 'listing.distance',
      value: t('map.distanceAway', { km: card.distanceKm.toFixed(1) }),
    });
  }

  const address = formatPlaceAddress(place);
  if (address) {
    cells.push({ labelKey: 'listing.locationLabel', value: address });
  } else if (place.location?.city?.trim()) {
    cells.push({ labelKey: 'listing.locationLabel', value: place.location.city.trim() });
  }

  const facilityRows = place.facilities?.facilities ?? [];
  const facilityCount = facilityRows.filter((row) => row.facility).length;
  if (facilityCount > 0) {
    cells.push({
      labelKey: 'listing.facilities',
      value: String(facilityCount),
    });
  }

  return cells;
}

export type PlaceDetailNotice = {
  id: string;
  title: string;
  detail?: string;
};

const FACILITY_NOTICE_KEYS: Record<string, { titleKey: string; detailKey?: string }> = {
  contact_required: { titleKey: 'listing.noticeContactRequired' },
  membership_required: { titleKey: 'listing.noticeMembershipRequired' },
  '24_7_access': { titleKey: 'listing.noticeAccess247' },
};

export function buildPlaceDetailNotices(place: MapPlaceRecord, t: TranslateFn): PlaceDetailNotice[] {
  const notices: PlaceDetailNotice[] = [];

  const rules = place.facilities?.rules?.trim();
  if (rules) {
    notices.push({
      id: 'rules',
      title: t('listing.noticeRulesTitle'),
      detail: rules,
    });
  }

  const contactInfo = place.facilities?.contactInfo?.trim();
  if (contactInfo) {
    notices.push({
      id: 'contact',
      title: t('listing.noticeContactTitle'),
      detail: contactInfo,
    });
  }

  for (const row of place.facilities?.facilities ?? []) {
    const key = row.facility;
    if (!key || typeof key !== 'string') {
      continue;
    }
    const mapping = FACILITY_NOTICE_KEYS[key];
    if (!mapping) {
      continue;
    }
    notices.push({
      id: `facility-${key}`,
      title: t(mapping.titleKey),
      detail: mapping.detailKey ? t(mapping.detailKey) : undefined,
    });
  }

  return notices;
}

export function buildPlaceKindPillLabel(place: MapPlaceRecord, t: TranslateFn): string {
  return buildMapPlaceKindLabel(place, t);
}
