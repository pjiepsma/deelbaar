import type { Payload } from 'payload'
import { MAP_PLACE_COLLECTION_SLUGS, type MapPlaceCollectionSlug } from '../constants/mapPlaces'

export type PlaceReference =
  | {
      relationTo: MapPlaceCollectionSlug
      value: string | number
    }
  | {
      relationTo: MapPlaceCollectionSlug
      value: Record<string, unknown>
    }

export function isMapPlaceCollectionSlug(value: string): value is MapPlaceCollectionSlug {
  return (MAP_PLACE_COLLECTION_SLUGS as readonly string[]).includes(value)
}

export function getPlaceCollection(place: unknown): MapPlaceCollectionSlug {
  if (!place || typeof place !== 'object') {
    throw new Error('place reference is required')
  }
  const relationTo = (place as { relationTo?: string }).relationTo
  if (!relationTo || !isMapPlaceCollectionSlug(relationTo)) {
    throw new Error(`invalid place relationTo: ${String(relationTo)}`)
  }
  return relationTo
}

export function getPlaceId(place: unknown): string | number {
  if (!place || typeof place !== 'object') {
    throw new Error('place reference is required')
  }
  const value = (place as { value?: unknown }).value
  if (typeof value === 'string' || typeof value === 'number') {
    return value
  }
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') {
      return id
    }
  }
  throw new Error('place value id is missing')
}

export async function findPlaceByReference(payload: Payload, place: unknown): Promise<Record<string, unknown>> {
  const collection = getPlaceCollection(place)
  const id = getPlaceId(place)
  const placeDoc = await payload.findByID({
    collection,
    id,
  })
  return placeDoc as unknown as Record<string, unknown>
}
