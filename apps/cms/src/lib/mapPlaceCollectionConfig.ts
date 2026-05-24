import {
  KIOSK_SUBTYPE_OPTIONS,
  MAP_PLACE_COLLECTION_SLUGS,
  MAP_PLACE_LABEL_BY_COLLECTION,
  MAP_PLACE_SUBTYPE_FIELD_BY_COLLECTION,
  MARKET_SUBTYPE_OPTIONS,
  TAP_SUBTYPE_OPTIONS,
  type MapPlaceCollectionSlug,
} from '../constants/mapPlaces'

const SUBTYPE_OPTIONS_BY_COLLECTION: Record<
  MapPlaceCollectionSlug,
  ReadonlyArray<{ label: string; value: string }>
> = {
  kiosks: KIOSK_SUBTYPE_OPTIONS,
  markets: MARKET_SUBTYPE_OPTIONS,
  taps: TAP_SUBTYPE_OPTIONS,
}

export function parseMapPlaceCollection(value: unknown): MapPlaceCollectionSlug | null {
  if (typeof value !== 'string') {
    return null
  }
  const candidate = value.trim() as MapPlaceCollectionSlug
  return MAP_PLACE_COLLECTION_SLUGS.includes(candidate) ? candidate : null
}

export function mapPlaceSubtypeField(collection: MapPlaceCollectionSlug): string {
  return MAP_PLACE_SUBTYPE_FIELD_BY_COLLECTION[collection]
}

export function mapPlaceSubtypeOptions(
  collection: MapPlaceCollectionSlug,
): ReadonlyArray<{ label: string; value: string }> {
  return SUBTYPE_OPTIONS_BY_COLLECTION[collection]
}

export function mapPlaceLabel(collection: MapPlaceCollectionSlug): string {
  return MAP_PLACE_LABEL_BY_COLLECTION[collection]
}

export function buildSubtypeData(
  collection: MapPlaceCollectionSlug,
  subtype: string,
): Record<string, string> {
  const fieldName = mapPlaceSubtypeField(collection)
  return { [fieldName]: subtype }
}
