import { MAP_CENTER } from './map.constants';
import type { MapListingCard, MapPlaceRecord } from './map.types';

const EARTH_RADIUS_KM = 6371;

const DEG_TO_RAD = Math.PI / 180;

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

function pickImageUrl(place: MapPlaceRecord, serverOrigin: string): string | undefined {
  const row = place.pictures?.find((p) => p.status === 'approved') ?? place.pictures?.[0];
  if (!row) {
    return undefined;
  }
  const photo = row.photo;
  if (!photo || typeof photo === 'string' || typeof photo === 'number') {
    return undefined;
  }
  return resolveMediaUrl(serverOrigin, photo.url ?? photo.thumbnailURL);
}

function resolveListingLngLat(doc: MapPlaceRecord): [number, number] | undefined {
  const coords = doc.location?.coordinates;
  if (coords && coords.length === 2) {
    const [lng, lat] = coords;
    if (typeof lng === 'number' && typeof lat === 'number' && !Number.isNaN(lng) && !Number.isNaN(lat)) {
      return [lng, lat];
    }
  }

  const lat = doc.location?.latitude;
  const lng = doc.location?.longitude;
  if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return [lng, lat];
  }

  return undefined;
}

export function mapPayloadListingToMapCard(
  doc: MapPlaceRecord,
  serverOrigin: string,
  referenceLngLat: [number, number],
): MapListingCard {
  const lngLat = resolveListingLngLat(doc);
  const distanceKm = lngLat ? haversineKm(referenceLngLat, lngLat) : undefined;

  return {
    id: doc.id,
    mapPlaceCollection: doc.mapPlaceCollection,
    title: doc.name,
    kioskSubtype: doc.kioskSubtype,
    marketSubtype: doc.marketSubtype,
    tapSubtype: doc.tapSubtype,
    distanceKm,
    lngLat,
    imageUrl: pickImageUrl(doc, serverOrigin),
    loved: false,
    interaction: doc.interaction,
  };
}

export function mapPayloadListingsToMapCards(
  listings: MapPlaceRecord[],
  serverOrigin: string,
  referenceLngLat: [number, number] = MAP_CENTER,
): MapListingCard[] {
  return listings.map((listing) => mapPayloadListingToMapCard(listing, serverOrigin, referenceLngLat));
}

export function sortMapCardsByDistance(cards: MapListingCard[]): MapListingCard[] {
  return [...cards].sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));
}
