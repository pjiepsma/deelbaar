export type MapPlaceCollection = 'kiosks' | 'markets' | 'taps'

export const MAP_PLACE_FILTERS: ReadonlyArray<{ value: 'All' | MapPlaceCollection; label: string }> = [
  { value: 'All', label: 'All' },
  { value: 'kiosks', label: 'Kiosks' },
  { value: 'markets', label: 'Markets' },
  { value: 'taps', label: 'Taps' },
]

const KIOSK_SUBTYPE_LABEL: Record<string, string> = {
  books: 'Books',
  hygiene: 'Hygiene',
  community: 'Community',
  other: 'Other',
}

const MARKET_SUBTYPE_LABEL: Record<string, string> = {
  honey: 'Honey',
  milk: 'Milk',
  meat: 'Meat',
  vegetables: 'Vegetables',
  other: 'Other',
}

const TAP_SUBTYPE_LABEL: Record<string, string> = {
  indoor: 'Indoor',
  outdoor: 'Outdoor',
}

export function subtypeOptionsForCollection(
  collection: MapPlaceCollection,
): ReadonlyArray<{ value: string; label: string }> {
  if (collection === 'kiosks') {
    return Object.entries(KIOSK_SUBTYPE_LABEL).map(([value, label]) => ({ value, label }))
  }
  if (collection === 'markets') {
    return Object.entries(MARKET_SUBTYPE_LABEL).map(([value, label]) => ({ value, label }))
  }
  return Object.entries(TAP_SUBTYPE_LABEL).map(([value, label]) => ({ value, label }))
}

export function defaultSubtypeForCollection(collection: MapPlaceCollection): string {
  if (collection === 'kiosks') return 'other'
  if (collection === 'markets') return 'other'
  return 'outdoor'
}

export function buildMapPlaceKindLabel(place: {
  mapPlaceCollection: MapPlaceCollection
  kioskSubtype?: string | null
  marketSubtype?: string | null
  tapSubtype?: string | null
}): string {
  if (place.mapPlaceCollection === 'kiosks') {
    const subtype = place.kioskSubtype
    if (!subtype) {
      throw new Error('kioskSubtype is required for kiosks')
    }
    return `Kiosk · ${KIOSK_SUBTYPE_LABEL[subtype] ?? subtype}`
  }
  if (place.mapPlaceCollection === 'markets') {
    const subtype = place.marketSubtype
    if (!subtype) {
      throw new Error('marketSubtype is required for markets')
    }
    return `Market · ${MARKET_SUBTYPE_LABEL[subtype] ?? subtype}`
  }
  const subtype = place.tapSubtype
  if (!subtype) {
    throw new Error('tapSubtype is required for taps')
  }
  return `Tap · ${TAP_SUBTYPE_LABEL[subtype] ?? subtype}`
}
