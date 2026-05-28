import { Image } from 'react-native';

import type { AppLocale } from '../../context/LocaleContext';
import type { PlaceDetailReviewRow } from '../../features/listings/placeDetailReviews.model';
import { mapReviewsToPlaceDetailRows } from '../../features/listings/placeDetailReviews.model';
import { resolveHeroPhotoUrls } from '../../features/listings/placeDetail.model';
import type { MapPlaceRecord } from '../../features/map/map.types';
import type { MapPlaceCollection } from '../mapPlaces/mapPlaceTaxonomy';
import { fetchPlaceDetail } from '../api/listings/fetchPlaceDetail';
import { fetchPlaceReviews } from '../api/reviews/fetchPlaceReviews';
import { mapPayloadListingToMapCard } from '../../features/map/mapListing.mapper';

export const PLACE_DETAIL_CACHE_MAX_ENTRIES = 20;
export const PLACE_DETAIL_STALE_MS = 5 * 60 * 1000;

export type PlaceDetailCacheEntry = {
  place: MapPlaceRecord;
  reviews: PlaceDetailReviewRow[];
  fetchedAt: number;
};

const cache = new Map<string, PlaceDetailCacheEntry>();
const accessOrder: string[] = [];

let activePrefetchAbort: AbortController | null = null;
let activePrefetchKey: string | null = null;

export function placeDetailCacheKey(collection: MapPlaceCollection, id: number): string {
  return `${collection}-${id}`;
}

function touchCacheKey(key: string): void {
  const index = accessOrder.indexOf(key);
  if (index >= 0) {
    accessOrder.splice(index, 1);
  }
  accessOrder.push(key);
}

function evictOldestIfNeeded(): void {
  while (cache.size > PLACE_DETAIL_CACHE_MAX_ENTRIES && accessOrder.length > 0) {
    const oldest = accessOrder.shift();
    if (oldest) {
      cache.delete(oldest);
    }
  }
}

export function getCachedPlaceDetail(
  collection: MapPlaceCollection,
  id: number,
): PlaceDetailCacheEntry | null {
  const key = placeDetailCacheKey(collection, id);
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  touchCacheKey(key);
  return entry;
}

export function isPlaceDetailCacheStale(entry: PlaceDetailCacheEntry): boolean {
  return Date.now() - entry.fetchedAt > PLACE_DETAIL_STALE_MS;
}

export function setCachedPlaceDetail(
  collection: MapPlaceCollection,
  id: number,
  entry: Omit<PlaceDetailCacheEntry, 'fetchedAt'> & { fetchedAt?: number },
): void {
  const key = placeDetailCacheKey(collection, id);
  cache.set(key, {
    place: entry.place,
    reviews: entry.reviews,
    fetchedAt: entry.fetchedAt ?? Date.now(),
  });
  touchCacheKey(key);
  evictOldestIfNeeded();
}

export function clearPlaceDetailPrefetchCache(): void {
  cache.clear();
  accessOrder.length = 0;
  activePrefetchAbort?.abort();
  activePrefetchAbort = null;
  activePrefetchKey = null;
}

async function prefetchHeroImages(place: MapPlaceRecord, serverOrigin: string): Promise<void> {
  const card = mapPayloadListingToMapCard(place, serverOrigin, [0, 0]);
  const urls = resolveHeroPhotoUrls(place, serverOrigin, card.imageUrl);
  await Promise.all(
    urls.map(async (url) => {
      try {
        await Image.prefetch(url);
      } catch {
        /* ignore image prefetch failures */
      }
    }),
  );
}

export type LoadPlaceDetailResult = {
  place: MapPlaceRecord;
  reviews: PlaceDetailReviewRow[];
};

export async function loadPlaceDetailWithReviews(params: {
  collection: MapPlaceCollection;
  id: number;
  locale: AppLocale;
  serverOrigin: string | undefined;
  signal?: AbortSignal;
}): Promise<LoadPlaceDetailResult | null> {
  const placePromise = fetchPlaceDetail(params.collection, params.id);
  const reviewsPromise = params.serverOrigin
    ? fetchPlaceReviews(params.collection, params.id).catch(() => [])
    : Promise.resolve([]);

  const place = await placePromise;
  if (params.signal?.aborted) {
    return null;
  }
  if (!place) {
    return null;
  }

  const reviewDocs = await reviewsPromise;
  if (params.signal?.aborted) {
    return null;
  }

  const reviews = params.serverOrigin
    ? mapReviewsToPlaceDetailRows(reviewDocs, params.serverOrigin, params.locale)
    : [];

  return { place, reviews };
}

export async function prefetchPlaceDetail(params: {
  collection: MapPlaceCollection;
  id: number;
  locale: AppLocale;
  serverOrigin: string | undefined;
}): Promise<void> {
  const key = placeDetailCacheKey(params.collection, params.id);
  const existing = cache.get(key);
  if (existing && !isPlaceDetailCacheStale(existing)) {
    return;
  }

  if (activePrefetchKey !== key) {
    activePrefetchAbort?.abort();
    activePrefetchAbort = new AbortController();
    activePrefetchKey = key;
  }

  const signal = activePrefetchAbort?.signal;
  const loaded = await loadPlaceDetailWithReviews({ ...params, signal });
  if (!loaded || signal?.aborted || activePrefetchKey !== key) {
    return;
  }

  setCachedPlaceDetail(params.collection, params.id, {
    place: loaded.place,
    reviews: loaded.reviews,
  });

  if (params.serverOrigin) {
    await prefetchHeroImages(loaded.place, params.serverOrigin);
  }
}

export function logPlaceDetailCacheAccess(
  collection: MapPlaceCollection,
  id: number,
  hit: boolean,
): void {
  if (!__DEV__) {
    return;
  }
  console.log(`[placeDetailCache] ${hit ? 'hit' : 'miss'} ${placeDetailCacheKey(collection, id)}`);
}
