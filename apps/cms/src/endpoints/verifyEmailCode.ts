import type { Endpoint } from 'payload'
import { loginOperation, verifyEmailOperation } from 'payload'

import { timingSafeOtpHashMatch } from '../lib/signupOtp'

const VERIFY_EMAIL_CODE_PATH = '/verify-email-code'

type VerifyBody = {
  email?: string
  password?: string
  code?: string
}

const json = (body: object, init?: ResponseInit): Response => {
  const headers = new Headers(init?.headers)
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  return new Response(JSON.stringify(body), { ...init, headers })
}

const normalizeEmail = (value: string): string => value.trim().toLowerCase()

const readJsonBody = async (req: unknown): Promise<VerifyBody | null> => {
  const asRequest = req as { text?: () => Promise<string> }
  if (typeof asRequest.text !== 'function') {
    return null
  }
  try {
    const raw = await asRequest.text()
    if (!raw || typeof raw !== 'string') {
      return null
    }
    return JSON.parse(raw) as VerifyBody
  } catch {
    return null
  }
}

const normalizeVerifyCode = (raw: string): string => raw.replace(/\D/g, '').slice(0, 6)

export const verifyEmailCodeEndpoint: Endpoint = {
  path: VERIFY_EMAIL_CODE_PATH,
  method: 'post',
  handler: async (req) => {
    try {
      const body = await readJsonBody(req)
      const rawEmail = typeof body?.email === 'string' ? body.email : ''
      const email = normalizeEmail(rawEmail)
      const password = typeof body?.password === 'string' ? body.password : ''
      const code = normalizeVerifyCode(typeof body?.code === 'string' ? body.code : '')

      if (!email.includes('@')) {
        return json({ error: 'Enter a valid email address.' }, { status: 400 })
      }
      if (password.length < 1) {
        return json({ error: 'Password is required.' }, { status: 400 })
      }
      if (code.length !== 6) {
        return json({ error: 'Enter the 6-digit code from your email.' }, { status: 400 })
      }

      const usersCollection = req.payload.collections['users']
      if (!usersCollection) {
        return json({ error: 'Authentication is not configured.' }, { status: 500 })
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
            _verified?: boolean
            _verificationToken?: string | null
            signupOtpExpiresAt?: string | null
            signupOtpHash?: string | null
          }
        | undefined

      if (!user) {
        return json({ error: 'Account not found.' }, { status: 404 })
      }

      if (user._verified) {
        const loginResult = await loginOperation({
          collection: usersCollection,
          req,
          data: { email, password },
          depth: 0,
        })
        if (!loginResult.token || !loginResult.user) {
          return json({ error: 'Could not start session.' }, { status: 500 })
        }
        return json({ token: loginResult.token, user: loginResult.user })
      }

      const expiresMs = user.signupOtpExpiresAt ? new Date(user.signupOtpExpiresAt).getTime() : 0
      if (!expiresMs || Number.isNaN(expiresMs) || Date.now() > expiresMs) {
        return json({ error: 'This code has expired. Request a new one.' }, { status: 400 })
      }

      if (!timingSafeOtpHashMatch(code, user.signupOtpHash)) {
        return json({ error: 'Invalid verification code.' }, { status: 400 })
      }

      const verificationToken = user._verificationToken
      if (!verificationToken || typeof verificationToken !== 'string') {
        return json({ error: 'Verification link is missing for this account.' }, { status: 400 })
      }

      const ok = await verifyEmailOperation({
        collection: usersCollection,
        req,
        token: verificationToken,
      })

      if (!ok) {
        return json({ error: 'Email verification failed.' }, { status: 400 })
      }

      await req.payload.update({
        collection: 'users',
        id: user.id,
        data: {
          signupOtpHash: null,
          signupOtpExpiresAt: null,
        },
        req,
        overrideAccess: true,
      })

      const loginResult = await loginOperation({
        collection: usersCollection,
        req,
        data: { email, password },
        depth: 0,
      })

      if (!loginResult.token || !loginResult.user) {
        return json({ error: 'Verified, but login failed. Try logging in manually.' }, { status: 500 })
      }

      return json({ token: loginResult.token, user: loginResult.user })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed.'
      const lowered = message.toLowerCase()
      if (lowered.includes('password') || lowered.includes('email')) {
        return json({ error: message }, { status: 401 })
      }
      console.error('[verifyEmailCode]', error)
      return json({ error: message }, { status: 500 })
    }
  },
}
