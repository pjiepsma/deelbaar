import type { PayloadHandler } from 'payload'

const json = (body: object, init?: ResponseInit): Response => {
  const headers = new Headers(init?.headers)
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  return new Response(JSON.stringify(body), { ...init, headers })
}

type QueryBag = Record<string, string | string[] | undefined>
type SearchScope = 'city' | 'province' | 'country' | 'world'

const getQueryParam = (req: Parameters<PayloadHandler>[0], key: string): string | null => {
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

export const listingsNearby: PayloadHandler = async (req) => {
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

    const listings = await req.payload.find({
      collection: 'listings',
      where: {
        'location.coordinates': {
          near: [lon, lat, enforcedRadius],
        },
      },
      limit: maxResults,
      depth: 2,
    })

    const listingsWithDistance = listings.docs.map((listing: Record<string, unknown>) => {
      const loc = listing.location as { coordinates?: [number, number] } | undefined
      if (loc?.coordinates) {
        const [listingLon, listingLat] = loc.coordinates
        const distance = calculateDistance(lat, lon, listingLat, listingLon)

        return {
          ...listing,
          distance: Math.round(distance * 100) / 100,
        }
      }
      return listing
    })

    listingsWithDistance.sort(
      (a: { distance?: number }, b: { distance?: number }) =>
        (a.distance ?? Infinity) - (b.distance ?? Infinity),
    )

    return json({
      docs: listingsWithDistance,
      totalDocs: listings.totalDocs,
      limit: listings.limit,
      page: listings.page,
      totalPages: listings.totalPages,
      scope: allowedScope,
      radius: enforcedRadius,
    })
  } catch (error) {
    console.error('Error fetching nearby listings:', error)
    return json({ error: 'Failed to fetch nearby listings' }, { status: 500 })
  }
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
