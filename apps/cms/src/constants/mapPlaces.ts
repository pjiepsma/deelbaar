export const MAP_PLACE_COLLECTION_SLUGS = ['kiosks', 'markets', 'taps'] as const
export type MapPlaceCollectionSlug = (typeof MAP_PLACE_COLLECTION_SLUGS)[number]

export const MAP_PLACE_RELATION_TO = [...MAP_PLACE_COLLECTION_SLUGS]

export const KIOSK_SUBTYPE_OPTIONS = [
  { label: 'Books', value: 'books' },
  { label: 'Hygiene', value: 'hygiene' },
  { label: 'Community', value: 'community' },
  { label: 'Other', value: 'other' },
] as const
export type KioskSubtype = (typeof KIOSK_SUBTYPE_OPTIONS)[number]['value']

export const MARKET_SUBTYPE_OPTIONS = [
  { label: 'Honey', value: 'honey' },
  { label: 'Milk', value: 'milk' },
  { label: 'Meat', value: 'meat' },
  { label: 'Vegetables', value: 'vegetables' },
  { label: 'Other', value: 'other' },
] as const
export type MarketSubtype = (typeof MARKET_SUBTYPE_OPTIONS)[number]['value']

export const TAP_SUBTYPE_OPTIONS = [
  { label: 'Indoor', value: 'indoor' },
  { label: 'Outdoor', value: 'outdoor' },
] as const
export type TapSubtype = (typeof TAP_SUBTYPE_OPTIONS)[number]['value']

export const MAP_PLACE_LABEL_BY_COLLECTION: Record<MapPlaceCollectionSlug, string> = {
  kiosks: 'Kiosk',
  markets: 'Market',
  taps: 'Tap',
}

export const MAP_PLACE_SUBTYPE_FIELD_BY_COLLECTION: Record<MapPlaceCollectionSlug, string> = {
  kiosks: 'kioskSubtype',
  markets: 'marketSubtype',
  taps: 'tapSubtype',
}

export const MAP_PLACE_SUBTYPE_OPTIONS_BY_COLLECTION: Record<
  MapPlaceCollectionSlug,
  ReadonlyArray<{ label: string; value: string }>
> = {
  kiosks: KIOSK_SUBTYPE_OPTIONS,
  markets: MARKET_SUBTYPE_OPTIONS,
  taps: TAP_SUBTYPE_OPTIONS,
}
