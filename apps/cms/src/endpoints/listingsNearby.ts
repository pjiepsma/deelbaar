import { liveNonDeletedPlaceClauses } from '../constants/listingsPublicVisibility'
import { MAP_PLACE_COLLECTION_SLUGS, type MapPlaceCollectionSlug } from '../constants/mapPlaces'
import { getPlaceInteractionContract } from '../lib/placeInteractionScope'
import { resolvePayload, type AppRouteRequest } from './resolvePayloadFromRequest'

const json = (body: object, init?: ResponseInit): Response => {
  const headers = new Headers(init?.headers)
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  return new Response(JSON.stringify(body), { ...init, headers })
}

type QueryBag = Record<string, string | string[] | undefined>
type SearchScope = 'city' | 'province' | 'country' | 'world'

const getQueryParam = (req: AppRouteRequest, key: string): string | null => {
  if (typeof req.url === 'string' && req.url.length > 0) {
    try {
      const fromUrl = new URL(req.url).searchParams.get(key)
      if (fromUrl) return fromUrl
    } catch {
      /* ignore */
    }
  }
  const bag = (req as { query?: QueryBag }).query
  if (!bag || !(key in bag)) return null
  const v = bag[key]
  if (Array.isArray(v)) return v[0] ?? null
  return typeof v === 'string' ? v : null
}

export async function listingsNearby(req: AppRouteRequest): Promise<Response> {
  try {
    const latitude = getQueryParam(req, 'latitude')
    const longitude = getQueryParam(req, 'longitude')
    const radiusRaw = getQueryParam(req, 'radius') ?? '50000'
    const limitRaw = getQueryParam(req, 'limit') ?? '100'
    const scopeRaw = getQueryParam(req, 'scope') ?? 'city'
    const collectionRaw = getQueryParam(req, 'collection')

    if (!latitude || !longitude) {
      return json(
        {
          error: 'Missing required parameters: latitude and longitude',
        },
        { status: 400 },
      )
    }

    const lat = parseFloat(latitude)
    const lon = parseFloat(longitude)
    const maxDistance = parseInt(radiusRaw, 10)
    const maxResults = parseInt(limitRaw, 10)
    const requestedScope: SearchScope = normalizeScope(scopeRaw)
    const collections = normalizeCollections(collectionRaw)
    if (!collections) {
      return json(
        {
          error: 'Invalid collection',
          message: `Use one of: ${MAP_PLACE_COLLECTION_SLUGS.join(', ')} or "all"`,
        },
        { status: 400 },
      )
    }
    const enforcedRadius = Math.min(maxDistance, radiusForScope(requestedScope))

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return json(
        {
          error: 'Invalid latitude or longitude',
        },
        { status: 400 },
      )
    }

    const { swLat, swLon, neLat, neLon } = boundingBoxDegrees(lat, lon, enforcedRadius)
    const boxFetchLimit = Math.min(Math.max(maxResults * 25, maxResults), 1000)

    const payload = await resolvePayload(req)
    const listingsDocs: Array<Record<string, unknown>> = []
    for (const collection of collections) {
      const result = await payload.find({
        collection,
        req,
        where: {
          and: [
            ...liveNonDeletedPlaceClauses,
            {
              'location.latitude': {
                greater_than_equal: swLat,
              },
            },
            {
              'location.latitude': {
                less_than_equal: neLat,
              },
            },
            {
              'location.longitude': {
                greater_than_equal: swLon,
              },
            },
            {
              'location.longitude': {
                less_than_equal: neLon,
              },
            },
          ],
        },
        limit: boxFetchLimit,
        depth: 0,
      })
      for (const placeDoc of result.docs as Record<string, unknown>[]) {
        listingsDocs.push({
          ...placeDoc,
          mapPlaceCollection: collection,
        })
      }
    }

    const radiusKm = enforcedRadius / 1000
    const listingsWithDistance = listingsDocs
      .map((listing: Record<string, unknown>) => {
        const loc = listing.location as
          | { coordinates?: [number, number]; latitude?: number; longitude?: number }
          | undefined
        const listingLat = loc?.latitude
        const listingLon = loc?.longitude
        if (typeof listingLat !== 'number' || typeof listingLon !== 'number') return null
        const distanceKm = calculateDistance(lat, lon, listingLat, listingLon)
        if (distanceKm > radiusKm) return null
        const interactionPromise = getPlaceInteractionContract(
          { payload, user: req.user ?? null },
          listing,
        )
        return {
          ...listing,
          distance: Math.round(distanceKm * 100) / 100,
          _interactionPromise: interactionPromise,
        }
      })
      .filter(Boolean) as Array<Record<string, unknown> & { _interactionPromise: Promise<unknown> }>

    listingsWithDistance.sort(
      (a: { distance?: number }, b: { distance?: number }) =>
        (a.distance ?? Infinity) - (b.distance ?? Infinity),
    )

    const trimmed = listingsWithDistance.slice(0, maxResults)
    const docsWithInteraction = await Promise.all(
      trimmed.map(async (row) => {
        const interaction = await row._interactionPromise
        const { _interactionPromise, ...placeRow } = row
        return {
          ...placeRow,
          interaction,
        }
      }),
    )

    return json({
      docs: docsWithInteraction,
      collections,
      totalDocs: docsWithInteraction.length,
      limit: maxResults,
      page: 1,
      totalPages: 1,
      scope: requestedScope,
      radius: enforcedRadius,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    console.error('[listings/nearby] failed:', message, stack)
    return json(
      { error: 'Failed to fetch nearby listings', details: message },
      { status: 500 },
    )
  }
}

function normalizeCollections(value: string | null): MapPlaceCollectionSlug[] | null {
  if (!value || value.trim() === 'all') {
    return [...MAP_PLACE_COLLECTION_SLUGS]
  }
  const candidate = value.trim() as MapPlaceCollectionSlug
  if (!MAP_PLACE_COLLECTION_SLUGS.includes(candidate)) {
    return null
  }
  return [candidate]
}

/** ~meters per degree latitude (WGS84, mid-latitudes) */
const METERS_PER_DEG_LAT = 111_320

/** Axis-aligned square around (lat, lon) containing a circle of radiusMeters (for $geoWithin). */
function boundingBoxDegrees(lat: number, lon: number, radiusMeters: number) {
  const dLat = radiusMeters / METERS_PER_DEG_LAT
  const cosLat = Math.cos((lat * Math.PI) / 180)
  const dLon = radiusMeters / (METERS_PER_DEG_LAT * Math.max(cosLat, 0.01))
  const swLat = lat - dLat
  const neLat = lat + dLat
  const swLon = lon - dLon
  const neLon = lon + dLon
  return { swLat, swLon, neLat, neLon }
}

function normalizeScope(value: string): SearchScope {
  if (value === 'province' || value === 'country' || value === 'world') return value
  return 'city'
}

function radiusForScope(scope: SearchScope): number {
  switch (scope) {
    case 'city':
      return 15000
    case 'province':
      return 80000
    case 'country':
      return 300000
    case 'world':
      return 20000000
  }
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}
