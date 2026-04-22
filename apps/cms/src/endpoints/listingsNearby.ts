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
    const authUser = req.user as
      | {
          id?: string
          searchAccess?: { province?: boolean; country?: boolean; world?: boolean }
        }
      | undefined
    const isLoggedIn = !!authUser?.id
    const allowedScope = getAllowedScope(requestedScope, isLoggedIn, authUser?.searchAccess)

    if (requestedScope !== allowedScope) {
      return json(
        {
          error: 'Search scope is locked',
          code: 'SEARCH_SCOPE_LOCKED',
          requestedScope,
          allowedScope,
          requiresLogin: !isLoggedIn && requestedScope !== 'city',
        },
        { status: 403 },
      )
    }

    const enforcedRadius = Math.min(maxDistance, radiusForScope(allowedScope))

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return json(
        {
          error: 'Invalid latitude or longitude',
        },
        { status: 400 },
      )
    }

    /*
     * Use $geoWithin + bounding box (same operator family as listings/bounds), not `near`.
     * Payload + Mongo paths for `near` are brittle (aggregation vs find, index quirks) and
     * were returning 500 in production here; box + haversine filter matches the circle well.
     */
    const { swLat, swLon, neLat, neLon } = boundingBoxDegrees(lat, lon, enforcedRadius)
    const boxFetchLimit = Math.min(Math.max(maxResults * 25, maxResults), 1000)

    const payload = await resolvePayload(req)
    const listings = await payload.find({
      collection: 'listings',
      req,
      where: {
        'location.coordinates': {
          within: {
            type: 'Polygon',
            coordinates: [
              [
                [swLon, swLat],
                [neLon, swLat],
                [neLon, neLat],
                [swLon, neLat],
                [swLon, swLat],
              ],
            ],
          },
        },
      },
      limit: boxFetchLimit,
      depth: 0,
    })

    const radiusKm = enforcedRadius / 1000
    const listingsWithDistance = listings.docs
      .map((listing: Record<string, unknown>) => {
        const loc = listing.location as { coordinates?: [number, number] } | undefined
        if (!loc?.coordinates) return null
        const [listingLon, listingLat] = loc.coordinates
        const distanceKm = calculateDistance(lat, lon, listingLat, listingLon)
        if (distanceKm > radiusKm) return null
        return {
          ...listing,
          distance: Math.round(distanceKm * 100) / 100,
        }
      })
      .filter(Boolean) as Record<string, unknown>[]

    listingsWithDistance.sort(
      (a: { distance?: number }, b: { distance?: number }) =>
        (a.distance ?? Infinity) - (b.distance ?? Infinity),
    )

    const trimmed = listingsWithDistance.slice(0, maxResults)

    return json({
      docs: trimmed,
      totalDocs: trimmed.length,
      limit: maxResults,
      page: 1,
      totalPages: 1,
      scope: allowedScope,
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

function getAllowedScope(
  requestedScope: SearchScope,
  isLoggedIn: boolean,
  searchAccess?: { province?: boolean; country?: boolean; world?: boolean },
): SearchScope {
  if (requestedScope === 'city') return 'city'
  if (!isLoggedIn) return 'city'

  if (requestedScope === 'province') {
    return searchAccess?.province ? 'province' : 'city'
  }

  if (requestedScope === 'country') {
    return searchAccess?.country ? 'country' : 'city'
  }

  return searchAccess?.world ? 'world' : 'city'
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
