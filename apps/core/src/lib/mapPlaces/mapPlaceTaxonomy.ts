export type MapPlaceCollection = 'kiosks' | 'markets' | 'taps';

export type MapPlaceFilterValue = 'All' | MapPlaceCollection;

export const MAP_PLACE_FILTER_VALUES: ReadonlyArray<MapPlaceFilterValue> = [
  'All',
  'kiosks',
  'markets',
  'taps',
];

export type TranslateFn = (path: string, vars?: Record<string, string>) => string;

export function mapPlaceFilterLabel(value: MapPlaceFilterValue, t: TranslateFn): string {
  switch (value) {
    case 'All':
      return t('placeKind.filterAll');
    case 'kiosks':
      return t('placeKind.filterKiosks');
    case 'markets':
      return t('placeKind.filterMarkets');
    case 'taps':
      return t('placeKind.filterTaps');
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
}

const KIOSK_SUBTYPES = ['books', 'hygiene', 'community', 'other'] as const;
const MARKET_SUBTYPES = ['honey', 'milk', 'meat', 'vegetables', 'other'] as const;
const TAP_SUBTYPES = ['indoor', 'outdoor'] as const;

export function subtypeOptionsForCollection(
  collection: MapPlaceCollection,
  t: TranslateFn,
): ReadonlyArray<{ value: string; label: string }> {
  const values =
    collection === 'kiosks' ? KIOSK_SUBTYPES : collection === 'markets' ? MARKET_SUBTYPES : TAP_SUBTYPES;
  return values.map((value) => ({
    value,
    label: t(`placeKind.subtype.${value}`),
  }));
}

export function defaultSubtypeForCollection(collection: MapPlaceCollection): string {
  if (collection === 'kiosks') return 'other';
  if (collection === 'markets') return 'other';
  return 'outdoor';
}

function resolveSubtype(place: {
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

export function buildMapPlaceKindLabel(
  place: {
    mapPlaceCollection: MapPlaceCollection;
    kioskSubtype?: string | null;
    marketSubtype?: string | null;
    tapSubtype?: string | null;
  },
  t: TranslateFn,
): string {
  const subtype = resolveSubtype(place);
  const collection = t(`placeKind.collection.${place.mapPlaceCollection}`);
  const subtypeLabel = t(`placeKind.subtype.${subtype}`);
  return t('placeKind.kindLabel', { collection, subtype: subtypeLabel });
}
