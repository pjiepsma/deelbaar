import { getPayload, type Payload, type PayloadRequest } from 'payload'

export type QueryDictionary = Record<string, string | string[] | undefined>

/** Next.js App Router passes Request/NextRequest; Payload may attach `payload` / `user`. */
export type AppRouteRequest = Request & {
  originalUrl?: string
  nextUrl?: URL
  query?: QueryDictionary
} & Partial<Pick<PayloadRequest, 'user' | 'payload'>>

let payloadConfigPromise: Promise<unknown> | null = null

async function loadPayloadConfig(): Promise<unknown> {
  if (!payloadConfigPromise) {
    payloadConfigPromise = import('@payload-config').then((mod) => {
      const candidate = (mod as { default?: unknown }).default ?? mod
      return candidate
    })
  }

  return payloadConfigPromise
}

export async function resolvePayload(req: AppRouteRequest): Promise<Payload> {
  if ('payload' in req && (req as PayloadRequest).payload) {
    return (req as PayloadRequest).payload
  }

  const config = await loadPayloadConfig()
  return getPayload({ config: config as never })
}
