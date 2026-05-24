import type { Endpoint } from 'payload'

import { config } from '@/config/config'
import { generateMail } from '@/globals/Mail/utilities/sendMail'

import { issueSignupOtpAndBuildVerificationEmail } from '../lib/signupVerificationEmailHtml'

const RESEND_VERIFICATION_CODE_PATH = '/resend-verification-code'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 10

const requestHistoryByIp = new Map<string, number[]>()

type Body = {
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

const readJsonBody = async (req: unknown): Promise<Body | null> => {
  const asRequest = req as { text?: () => Promise<string> }
  if (typeof asRequest.text !== 'function') {
    return null
  }
  try {
    const raw = await asRequest.text()
    if (!raw || typeof raw !== 'string') {
      return null
    }
    return JSON.parse(raw) as Body
  } catch {
    return null
  }
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

const isRateLimited = (ip: string): boolean => {
  const now = Date.now()
  const recentRequests = (requestHistoryByIp.get(ip) ?? []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)
  recentRequests.push(now)
  requestHistoryByIp.set(ip, recentRequests)
  return recentRequests.length > RATE_LIMIT_MAX_REQUESTS
}

export const resendVerificationCodeEndpoint: Endpoint = {
  path: RESEND_VERIFICATION_CODE_PATH,
  method: 'post',
  handler: async (req) => {
    try {
      const ip = getRequestIp(req as { ip?: unknown; headers?: Headers })
      if (isRateLimited(ip)) {
        return json({ error: 'Too many requests. Try again later.' }, { status: 429 })
      }

      const body = await readJsonBody(req)
      const rawEmail = typeof body?.email === 'string' ? body.email : ''
      const email = normalizeEmail(rawEmail)

      if (!email.includes('@')) {
        return json({ error: 'Enter a valid email address.' }, { status: 400 })
      }

      const found = await req.payload.find({
        collection: 'users',
        where: { email: { equals: email } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
        req,
      })

      const user = found.docs[0] as
        | {
            id: number | string
            email?: string
            name?: string | null
            surname?: string | null
            _verified?: boolean
            _verificationToken?: string | null
          }
        | undefined

      if (!user) {
        return json({ ok: true })
      }

      if (user._verified) {
        return json({ error: 'This email is already verified.' }, { status: 400 })
      }

      const token = user._verificationToken
      if (!token || typeof token !== 'string') {
        return json({ error: 'Cannot resend verification for this account.' }, { status: 400 })
      }

      const resolvedEmail = user.email ?? email
      const html = await issueSignupOtpAndBuildVerificationEmail({
        req,
        token,
        user: {
          id: user.id,
          email: resolvedEmail,
          name: user.name,
          surname: user.surname,
        },
      })

      const baseUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || config.publicServerUrl
      const verificationUrl = `${baseUrl}/verify?token=${encodeURIComponent(token)}`
      const displayName =
        user.name || user.surname ? `${user.name ?? ''} ${user.surname ?? ''}`.trim() : user.email ?? email

      const { subject } = await generateMail({
        type: 'verify',
        placeholders: {
          userName: displayName,
          verificationUrl,
        },
        req,
      })

      await req.payload.email.sendEmail({
        to: email,
        subject,
        html,
      })

      return json({ ok: true })
    } catch (error) {
      console.error('[resendVerificationCode]', error)
      return json({ error: 'Could not resend verification email.' }, { status: 500 })
    }
  },
}
