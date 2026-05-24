import type { Endpoint } from 'payload'

const EMAIL_LOOKUP_COLLECTION_PATH = '/email-lookup'
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 30

const requestHistoryByIp = new Map<string, number[]>()

type LookupBody = {
  email?: string
}

const json = (body: object, init?: ResponseInit): Response => {
  const headers = new Headers(init?.headers)
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  return new Response(JSON.stringify(body), { ...init, headers })
}

const normalizeEmail = (value: string): string => value.trim().toLowerCase()

const isEmailValid = (value: string): boolean => value.includes('@')

const parseLookupBody = async (req: {
  body?: unknown
  data?: unknown
  json?: () => Promise<unknown>
}): Promise<LookupBody | null> => {
  const candidates: unknown[] = [req.body, req.data]

  if (typeof req.json === 'function') {
    try {
      candidates.push(await req.json())
    } catch {
      /* ignore */
    }
  }

  for (const candidate of candidates) {
    if (!candidate) {
      continue
    }

    if (typeof candidate === 'string') {
      try {
        return JSON.parse(candidate) as LookupBody
      } catch {
        continue
      }
    }

    if (typeof candidate === 'object') {
      return candidate as LookupBody
    }
  }

  return null
}

const isRateLimited = (ip: string): boolean => {
  const now = Date.now()
  const recentRequests = (requestHistoryByIp.get(ip) ?? []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)
  recentRequests.push(now)
  requestHistoryByIp.set(ip, recentRequests)
  return recentRequests.length > RATE_LIMIT_MAX_REQUESTS
}

const getRequestIp = (req: { ip?: unknown; headers?: Headers | { get?: (name: string) => string | null } }): string => {
  if (typeof req.ip === 'string' && req.ip.length > 0) {
    return req.ip
  }

  const forwardedFor = req.headers?.get?.('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  return 'unknown'
}

const readLookupBodyFromWebRequest = async (req: unknown): Promise<LookupBody | null> => {
  const asRequest = req as { text?: () => Promise<string> }
  if (typeof asRequest.text !== 'function') {
    return null
  }
  try {
    const raw = await asRequest.text()
    if (typeof raw !== 'string' || raw.length === 0) {
      return null
    }
    return JSON.parse(raw) as LookupBody
  } catch {
    return null
  }
}

const emailLookupHandler: Endpoint['handler'] = async (req) => {
  try {
    const ip = getRequestIp(req as { ip?: unknown; headers?: Headers })
    if (isRateLimited(ip)) {
      return json({ error: 'Too many lookup requests. Please try again later.' }, { status: 429 })
    }

    const body =
      (await readLookupBodyFromWebRequest(req)) ??
      (await parseLookupBody(req as { body?: unknown; data?: unknown; json?: () => Promise<unknown> }))
    const rawEmail = typeof body?.email === 'string' ? body.email : ''
    const email = normalizeEmail(rawEmail)

    if (!isEmailValid(email)) {
      return json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    const result = await req.payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email,
        },
      },
      limit: 1,
      depth: 0,
      req,
    })

    return json({ exists: !!result.docs[0] })
  } catch (error) {
    console.error('[emailLookup] lookup failed', error)
    return json({ error: 'Unable to check this email right now.' }, { status: 500 })
  }
}

export const emailLookupCollectionEndpoint: Endpoint = {
  path: EMAIL_LOOKUP_COLLECTION_PATH,
  method: 'post',
  handler: emailLookupHandler,
}
