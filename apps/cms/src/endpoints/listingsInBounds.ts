import { getPayload, type Payload, type PayloadRequest } from 'payload'

// Configuration constants
const DEFAULT_LIMIT = 100
const MAX_LIMIT = 1000
const MIN_LATITUDE = -90
const MAX_LATITUDE = 90
const MIN_LONGITUDE = -180
const MAX_LONGITUDE = 180

// Type definitions
type QueryDictionary = Record<string, string | string[] | undefined>

/** Next.js App Router passes Request/NextRequest; Payload may attach `payload` on the same object */
type AppRouteRequest = Request & {
  originalUrl?: string
  nextUrl?: URL
  query?: QueryDictionary
}

interface Coordinates {
  neLat: number
  neLon: number
  swLat: number
  swLon: number
}

interface BoundsValidationSuccess {
  valid: true
  coordinates: Coordinates
}

interface BoundsValidationError {
  valid: false
  error: string
}

type BoundsValidationResult = BoundsValidationSuccess | BoundsValidationError

interface ErrorResponse {
  error: string
  message?: string
  example?: Record<string, string>
}

interface SuccessResponse {
  docs: Record<string, unknown>[]
  bounds: {
    northEast: { lat: number; lon: number }
    southWest: { lat: number; lon: number }
  }
}

// Utility functions
const isHeadersObject = (headers: object): headers is Headers => {
  return 'get' in headers && typeof headers.get === 'function'
}

const getHeader = (req: AppRouteRequest, name: string): string | null => {
  const headers = req.headers
  const normalized = name.toLowerCase()

  if (!headers) {
    return null
  }

  if (isHeadersObject(headers)) {
    const value = headers.get(normalized)
    return value ?? null
  }

  const recordHeaders = headers as Record<string, string | string[] | undefined>
  const literal = recordHeaders[normalized]

  if (Array.isArray(literal)) {
    return literal[0] ?? null
  }

  if (typeof literal === 'string') {
    return literal
  }

  return null
}

const resolveUrl = (req: AppRouteRequest): URL | null => {
  if (req.nextUrl instanceof URL) {
    return req.nextUrl
  }

  const urlCandidate =
    typeof req.url === 'string' && req.url.length > 0
      ? req.url
      : typeof req.originalUrl === 'string' && req.originalUrl.length > 0
        ? req.originalUrl
        : null

  if (!urlCandidate) {
    return null
  }

  try {
    return new URL(urlCandidate)
  } catch {
    const host = getHeader(req, 'host')

    if (!host) {
      return null
    }

    const protocol = getHeader(req, 'x-forwarded-proto') ?? 'http'

    try {
      return new URL(urlCandidate, `${protocol}://${host}`)
    } catch {
      return null
    }
  }
}

const pickQueryValue = (source: QueryDictionary | null, key: string): string | null => {
  if (!source) {
    return null
  }

  const candidate = source[key]

  if (typeof candidate === 'string') {
    return candidate
  }

  if (Array.isArray(candidate) && candidate.length > 0) {
    return candidate[0]
  }

  return null
}

const toJsonResponse = (body: object, init?: ResponseInit): Response => {
  const headers = new Headers(init?.headers)

  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  return new Response(JSON.stringify(body), { ...init, headers })
}

let payloadConfigPromise: Promise<unknown> | null = null

const loadPayloadConfig = async (): Promise<unknown> => {
  if (!payloadConfigPromise) {
    payloadConfigPromise = import('@payload-config').then(mod => {
      const candidate = (mod as { default?: unknown }).default ?? mod
      return candidate
    })
  }

  return payloadConfigPromise
}

const resolvePayload = async (req: AppRouteRequest): Promise<Payload> => {
  if ('payload' in req && (req as PayloadRequest).payload) {
    return (req as PayloadRequest).payload
  }

  const config = await loadPayloadConfig()
  return getPayload({ config: config as never })
}

const validateBounds = (
  northEast: string,
  southWest: string
): BoundsValidationResult => {
  const [neLat, neLon] = northEast.split(',').map(value => Number.parseFloat(value))
  const [swLat, swLon] = southWest.split(',').map(value => Number.parseFloat(value))

  // Check for NaN
  if ([neLat, neLon, swLat, swLon].some(Number.isNaN)) {
    return { valid: false, error: 'Invalid coordinate format. Use: "lat,lon"' }
  }

  // Validate latitude ranges
  if (neLat < MIN_LATITUDE || neLat > MAX_LATITUDE || swLat < MIN_LATITUDE || swLat > MAX_LATITUDE) {
    return { valid: false, error: `Latitude must be between ${MIN_LATITUDE} and ${MAX_LATITUDE}` }
  }

  // Validate longitude ranges
  if (neLon < MIN_LONGITUDE || neLon > MAX_LONGITUDE || swLon < MIN_LONGITUDE || swLon > MAX_LONGITUDE) {
    return { valid: false, error: `Longitude must be between ${MIN_LONGITUDE} and ${MAX_LONGITUDE}` }
  }

  // Validate logical bounds
  if (neLat <= swLat) {
    return { valid: false, error: 'North latitude must be greater than south latitude' }
  }

  // Note: We don't validate neLon > swLon because the bounds could cross the antimeridian
  // (e.g., viewing the Pacific Ocean from Asia)

  return {
    valid: true,
    coordinates: { neLat, neLon, swLat, swLon }
  }
}

const parseLimit = (limitParam: string | null): number => {
  if (!limitParam) {
    return DEFAULT_LIMIT
  }

  const parsed = Number.parseInt(limitParam, 10)
  
  if (Number.isNaN(parsed) || parsed < 1) {
    return DEFAULT_LIMIT
  }

  return Math.min(parsed, MAX_LIMIT)
}

/**
 * Default projection for map bounds — must NOT expand `owner` → `users`.
 * `depth: 2` with a full document would populate other users’ profiles; the auth
 * `users` collection denies that → 403 "You are not allowed to perform this action."
 * The mobile client sends the same shape via `?select=`; we default to this if absent.
 */
const DEFAULT_LISTINGS_BOUNDS_SELECT = {
  id: true,
  name: true,
  description: true,
  category: true,
  publishStatus: true,
  location: {
    coordinates: true,
    address: true,
  },
  pictures: {
    photo: true,
  },
} as const

/**
 * Get listings within a bounding box (viewport bounds)
 * Useful when user is browsing the map and you want to show only visible listings
 * 
 * Query parameters:
 * - northEast: "lat,lon" (e.g., "52.5,4.9")
 * - southWest: "lat,lon" (e.g., "52.3,4.8")
 * - limit: Optional number (default: 100, max: 1000)
 */
export async function listingsInBounds(req: AppRouteRequest): Promise<Response> {
  const url = resolveUrl(req)

  if (!url) {
    const errorResponse: ErrorResponse = {
      error: 'Unable to determine request URL for bounds lookup'
    }
    return toJsonResponse(errorResponse, { status: 400 })
  }

  const searchParams = url.searchParams

  const queryDictionary =
    typeof req.query === 'object' && req.query !== null ? (req.query as QueryDictionary) : null

  const getParam = (key: string): string | null => {
    if (searchParams.has(key)) {
      return searchParams.get(key)
    }

    return pickQueryValue(queryDictionary, key)
  }

  const northEast = getParam('northEast')
  const southWest = getParam('southWest')
  const limitParam = getParam('limit')

  if (!northEast || !southWest) {
    const errorResponse: ErrorResponse = {
      error: 'Missing required parameters: northEast and southWest',
      example: {
        northEast: '52.5,4.9',
        southWest: '52.3,4.8',
        limit: '100',
      }
    }
    return toJsonResponse(errorResponse, { status: 400 })
  }

  // Validate bounds
  const validation = validateBounds(northEast, southWest)
  if (!validation.valid) {
    const errorResponse: ErrorResponse = { error: validation.error }
    return toJsonResponse(errorResponse, { status: 400 })
  }

  const { neLat, neLon, swLat, swLon } = validation.coordinates
  const limit = parseLimit(limitParam)

  const selectParam = getParam('select')
  let resolvedSelect: Record<string, unknown> = {
    ...DEFAULT_LISTINGS_BOUNDS_SELECT,
  }
  if (selectParam) {
    try {
      const parsed = JSON.parse(selectParam) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        resolvedSelect = parsed as Record<string, unknown>
      }
    } catch {
      /* keep default projection */
    }
  }

  try {
    const payload = await resolvePayload(req)

    const listings = await payload.find({
      collection: 'listings',
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
      limit,
      depth: 2,
      select: resolvedSelect as never,
    })

    const successResponse: SuccessResponse = {
      docs: listings.docs,
      bounds: {
        northEast: { lat: neLat, lon: neLon },
        southWest: { lat: swLat, lon: swLon },
      },
    }

    return toJsonResponse(successResponse)
  } catch (error) {
    console.error('Error fetching listings in bounds:', {
      error,
      bounds: { northEast, southWest },
      limit,
    })
    
    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch listings in bounds',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
    
    return toJsonResponse(errorResponse, { status: 500 })
  }
}






