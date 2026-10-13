import { addDataAndFileToRequest, type PayloadHandler } from 'payload'

import { MAP_PLACE_COLLECTION_SLUGS, type MapPlaceCollectionSlug } from '../constants/mapPlaces'
import { assertPlaceInteractionAllowed } from '../lib/placeInteractionScope'

const json = (body: object, init?: ResponseInit): Response => {
  const headers = new Headers(init?.headers)
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  return new Response(JSON.stringify(body), { ...init, headers })
}

function isMapPlaceCollection(value: string): value is MapPlaceCollectionSlug {
  return (MAP_PLACE_COLLECTION_SLUGS as readonly string[]).includes(value)
}

function readRequiredString(data: unknown, key: string): string | null {
  if (data === null || typeof data !== 'object') return null
  if (!(key in data)) return null
  const value = (data as Record<string, unknown>)[key]
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function readRequiredPlaceId(data: unknown): number | null {
  if (data === null || typeof data !== 'object') return null
  if (!('placeId' in data)) return null
  const raw = (data as Record<string, unknown>).placeId
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim().length > 0) {
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export const contributePlacePhoto: PayloadHandler = async (req) => {
  try {
    if (!req.user) {
      return json({ error: 'Unauthorized' }, { status: 401 })
    }

    await addDataAndFileToRequest(req)
    const data: unknown = req.data
    const collectionRaw = readRequiredString(data, 'collection')
    const placeId = readRequiredPlaceId(data)
    if (!collectionRaw || !isMapPlaceCollection(collectionRaw) || placeId === null) {
      return json({ error: 'Missing collection or placeId.' }, { status: 400 })
    }

    const file = req.file
    if (!file) {
      return json({ error: 'Missing photo file.' }, { status: 400 })
    }

    const PHOTO_CONTRIBUTION_COLLECTIONS: ReadonlyArray<MapPlaceCollectionSlug> = ['kiosks', 'markets']
    if (!PHOTO_CONTRIBUTION_COLLECTIONS.includes(collectionRaw)) {
      return json({ error: 'This place does not accept photos.' }, { status: 400 })
    }

    const place = await req.payload.findByID({
      collection: collectionRaw,
      id: placeId,
      depth: 0,
      overrideAccess: true,
    })

    await assertPlaceInteractionAllowed(
      req,
      { relationTo: collectionRaw, value: placeId },
      'photo contribution',
    )

    const media = await req.payload.create({
      collection: 'media',
      data: {
        alt: String((place as { name?: string }).name ?? 'Place photo'),
      },
      file,
      overrideAccess: true,
      req,
    })

    const picturesField = (place as { pictures?: unknown }).pictures
    const previousPictures = Array.isArray(picturesField) ? picturesField : []
    const nextPictures = [
      ...previousPictures,
      {
        photo: media.id,
        created_by: req.user.id,
        status: 'pending',
      },
    ]

    await req.payload.update({
      collection: collectionRaw,
      id: placeId,
      data: {
        pictures: nextPictures,
      },
      overrideAccess: true,
      req,
    })

    return json({ ok: true, mediaId: media.id, status: 'pending' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to contribute photo'
    console.error('contributePlacePhoto failed', error)
    return json({ error: message }, { status: 400 })
  }
}
