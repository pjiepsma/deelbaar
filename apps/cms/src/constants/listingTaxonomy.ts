export const LISTING_TYPE_VALUES = ['waterpoint', 'farm', 'little'] as const
export type ListingType = (typeof LISTING_TYPE_VALUES)[number]

export const LITTLE_SUBTYPE_VALUES = ['books', 'hygiene', 'community', 'other'] as const
export type LittleSubtype = (typeof LITTLE_SUBTYPE_VALUES)[number]

export const FARM_SUBTYPE_VALUES = ['honey', 'milk', 'meat', 'vegetables', 'other'] as const
export type FarmSubtype = (typeof FARM_SUBTYPE_VALUES)[number]

export const WATERPOINT_SUBTYPE_VALUES = ['indoor', 'outdoor'] as const
export type WaterpointSubtype = (typeof WATERPOINT_SUBTYPE_VALUES)[number]

export const LISTING_TYPE_OPTIONS: ReadonlyArray<{ label: string; value: ListingType }> = [
  { label: 'Waterpoints', value: 'waterpoint' },
  { label: 'Farm', value: 'farm' },
  { label: 'Little listings', value: 'little' },
]

export const LITTLE_SUBTYPE_OPTIONS: ReadonlyArray<{ label: string; value: LittleSubtype }> = [
  { label: 'Books', value: 'books' },
  { label: 'Hygiene', value: 'hygiene' },
  { label: 'Community', value: 'community' },
  { label: 'Other', value: 'other' },
]

export const FARM_SUBTYPE_OPTIONS: ReadonlyArray<{ label: string; value: FarmSubtype }> = [
  { label: 'Honey', value: 'honey' },
  { label: 'Milk', value: 'milk' },
  { label: 'Meat', value: 'meat' },
  { label: 'Vegetables', value: 'vegetables' },
  { label: 'Other', value: 'other' },
]

export const WATERPOINT_SUBTYPE_OPTIONS: ReadonlyArray<{ label: string; value: WaterpointSubtype }> =
  [
    { label: 'Indoor', value: 'indoor' },
    { label: 'Outdoor', value: 'outdoor' },
  ]

/** Maps removed flat `category` values to the new type + subtype pair. */
export function migrateLegacyListingCategory(category: string): {
  listingType: ListingType
  littleSubtype?: LittleSubtype
  farmSubtype?: FarmSubtype
  waterpointSubtype?: WaterpointSubtype
} {
  switch (category) {
    case 'book':
      return { listingType: 'little', littleSubtype: 'books' }
    case 'hygiene':
      return { listingType: 'little', littleSubtype: 'hygiene' }
    case 'community':
      return { listingType: 'little', littleSubtype: 'community' }
    case 'other':
      return { listingType: 'little', littleSubtype: 'other' }
    case 'farm':
    case 'food':
      return { listingType: 'farm', farmSubtype: 'other' }
    default:
      return { listingType: 'little', littleSubtype: 'other' }
  }
}

export type ListingKindPayload = {
  listingType?: ListingType | null
  littleSubtype?: LittleSubtype | null
  farmSubtype?: FarmSubtype | null
  waterpointSubtype?: WaterpointSubtype | null
  category?: string | null
}

export function normalizeListingKindFields(data: ListingKindPayload): void {
  const raw = data as Record<string, unknown>
  const legacy = raw.category
  if (typeof legacy === 'string' && legacy.length > 0 && !data.listingType) {
    Object.assign(data, migrateLegacyListingCategory(legacy))
  }
  delete raw.category

  const listingType = data.listingType
  if (!listingType) {
    throw new Error('listingType is required')
  }

  if (listingType === 'little') {
    data.farmSubtype = null
    data.waterpointSubtype = null
    if (!data.littleSubtype) {
      throw new Error('littleSubtype is required when listingType is "little"')
    }
    return
  }
  if (listingType === 'farm') {
    data.littleSubtype = null
    data.waterpointSubtype = null
    if (!data.farmSubtype) {
      throw new Error('farmSubtype is required when listingType is "farm"')
    }
    return
  }
  data.littleSubtype = null
  data.farmSubtype = null
  if (!data.waterpointSubtype) {
    throw new Error('waterpointSubtype is required when listingType is "waterpoint"')
  }
}
