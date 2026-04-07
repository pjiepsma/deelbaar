import { getPayload, type Payload, type PayloadRequest, type Where } from 'payload'

type QueryDictionary = Record<string, string | string[] | undefined>

type AppRouteRequest = Request & {
  originalUrl?: string
  nextUrl?: URL
  query?: QueryDictionary
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

const getHeader = (req: AppRouteRequest, name: string): string | null => {
  const headers = req.headers
  const normalized = name.toLowerCase()

  if (!headers) {
    return null
  }

  if (typeof (headers as Headers).get === 'function') {
    const value = (headers as Headers).get(normalized)
    return value ?? null
  }

  const literal = (headers as unknown as Record<string, string | string[] | undefined>)[normalized]

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

  if (typeof req.url !== 'string' || req.url.length === 0) {
    return null
  }

  try {
    return new URL(req.url)
  } catch {
    const host = getHeader(req, 'host')

    if (!host) {
      return null
    }

    const protocol = getHeader(req, 'x-forwarded-proto') ?? 'http'

    try {
      return new URL(req.url, `${protocol}://${host}`)
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

const getQueryValue = (req: AppRouteRequest, key: string): string | null => {
  const url = resolveUrl(req)

  if (url) {
    const fromParams = url.searchParams.get(key)

    if (fromParams) {
      return fromParams
    }
  }

  const dictionary: QueryDictionary | null =
    typeof req.query === 'object' && req.query !== null ? (req.query as QueryDictionary) : null

  return pickQueryValue(dictionary, key)
}

export async function GET(req: AppRouteRequest): Promise<Response> {
  const title = getQueryValue(req, 'title')
  const author = getQueryValue(req, 'author')
  const isbn = getQueryValue(req, 'isbn')
  const brand = getQueryValue(req, 'brand')
  const category = getQueryValue(req, 'category')

  if (!title && !author && !isbn && !brand && !category) {
    return toJsonResponse(
      { error: 'At least one search parameter (title, author, isbn, brand, or category) is required' },
      { status: 400 }
    )
  }

  const where: Where = {}

  if (title) {
    where.title = { like: title }
  }

  if (author) {
    where.author = { like: author }
  }

  if (isbn) {
    where.isbn = { equals: isbn }
  }

  if (brand) {
    where.brand = { like: brand }
  }

  if (category) {
    where.category = { equals: category }
  }

  try {
    const payload = await resolvePayload(req)

    const wishes = await payload.find({
      collection: 'wishes',
      where,
      depth: 1,
    })

    return toJsonResponse({ matches: wishes.docs })
  } catch (error) {
    console.error('Error matching wishes:', error)
    return toJsonResponse({ error: 'Failed to find matching wishes' }, { status: 500 })
  }
}



