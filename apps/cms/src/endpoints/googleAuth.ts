import crypto from 'node:crypto'
import type { Endpoint } from 'payload'
import { OAuth2Client } from 'google-auth-library'

import { config } from '../config/config'

const oAuthClient = new OAuth2Client()

const json = (body: object, init?: ResponseInit): Response => {
  const headers = new Headers(init?.headers)
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  return new Response(JSON.stringify(body), { ...init, headers })
}

const createTemporaryPassword = (): string => crypto.randomBytes(48).toString('base64url')

const toNameFields = (fullName?: string | null, givenName?: string | null, familyName?: string | null) => {
  if (givenName || familyName) {
    return {
      name: givenName || undefined,
      surname: familyName || undefined,
    }
  }

  if (!fullName) {
    return {
      name: undefined,
      surname: undefined,
    }
  }

  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return {
      name: undefined,
      surname: undefined,
    }
  }

  return {
    name: parts[0],
    surname: parts.length > 1 ? parts.slice(1).join(' ') : undefined,
  }
}

const issueSessionForUser = async (
  req: {
    payload: any
  },
  userId: number | string,
  email: string,
) => {
  const temporaryPassword = createTemporaryPassword()

  await req.payload.update({
    collection: 'users',
    id: userId,
    data: {
      password: temporaryPassword,
    },
    overrideAccess: true,
    req,
  })

  return req.payload.login({
    collection: 'users',
    data: {
      email,
      password: temporaryPassword,
    },
    req,
  })
}

type GoogleAuthRequestBody = {
  idToken?: string
}

type RequestWithBody = {
  body?: unknown
  data?: unknown
  json?: () => Promise<unknown>
}

const parseBody = async (req: RequestWithBody): Promise<GoogleAuthRequestBody | null> => {
  const reqLike = req as {
    body?: unknown
    data?: unknown
    json?: () => Promise<unknown>
  }

  const candidates: unknown[] = [reqLike.body, reqLike.data]

  if (typeof reqLike.json === 'function') {
    try {
      candidates.push(await reqLike.json())
    } catch {
      // ignore JSON parsing errors here; we'll reject below
    }
  }

  for (const candidate of candidates) {
    if (!candidate) {
      continue
    }

    if (typeof candidate === 'string') {
      try {
        return JSON.parse(candidate) as GoogleAuthRequestBody
      } catch {
        continue
      }
    }

    if (typeof candidate === 'object') {
      return candidate as GoogleAuthRequestBody
    }
  }

  return null
}

const googleAuthHandler: Endpoint['handler'] = async (req) => {
  try {
    const googleClientIds = config.googleClientIds.filter(Boolean)
    if (googleClientIds.length === 0) {
      return json(
        {
          error: 'Google Sign-In is not configured on the server.',
        },
        { status: 500 },
      )
    }

    const body = await parseBody(req as RequestWithBody)
    if (!body) {
      return json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const idToken = body?.idToken?.trim()
    if (!idToken) {
      return json({ error: 'Missing idToken.' }, { status: 400 })
    }

    const ticket = await oAuthClient.verifyIdToken({
      idToken,
      audience: googleClientIds,
    })

    const claims = ticket.getPayload()
    if (!claims) {
      return json({ error: 'Invalid Google token.' }, { status: 401 })
    }

    const googleSub = claims.sub
    const email = claims.email?.toLowerCase().trim()
    const emailVerified = claims.email_verified === true
    if (!googleSub || !email || !emailVerified) {
      return json({ error: 'Google account email is not verified.' }, { status: 401 })
    }

    const existingByGoogleSub = await req.payload.find({
      collection: 'users',
      where: {
        googleSub: {
          equals: googleSub,
        },
      },
      limit: 1,
      depth: 0,
      req,
    })

    if (existingByGoogleSub.docs[0]) {
      const existingUser = existingByGoogleSub.docs[0]
      const loginResult = await issueSessionForUser(req, existingUser.id, email)
      return json(loginResult)
    }

    const existingByEmail = await req.payload.find({
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

    if (existingByEmail.docs[0]) {
      const existingUser = existingByEmail.docs[0]
      if (!existingUser.googleSub) {
        return json(
          {
            error:
              'This email is already registered with a password. Use email login for this account.',
          },
          { status: 409 },
        )
      }

      if (existingUser.googleSub !== googleSub) {
        return json(
          {
            error: 'This email is already linked to a different Google account.',
          },
          { status: 409 },
        )
      }

      const loginResult = await issueSessionForUser(req, existingUser.id, email)
      return json(loginResult)
    }

    const { name, surname } = toNameFields(claims.name, claims.given_name, claims.family_name)
    const createData: Record<string, unknown> = {
      email,
      password: createTemporaryPassword(),
      _verified: true,
      isAnonymous: false,
      role: 'user',
      googleSub,
    }

    if (name) createData.name = name
    if (surname) createData.surname = surname

    const createdUser = await req.payload.create({
      collection: 'users',
      data: createData,
      overrideAccess: true,
      req,
    })

    const loginResult = await issueSessionForUser(req, createdUser.id, email)
    return json(loginResult)
  } catch (error) {
    console.error('[googleAuthEndpoint] Failed to authenticate with Google:', error)
    return json(
      {
        error: 'Google sign-in failed.',
      },
      { status: 500 },
    )
  }
}

export const googleAuthEndpoint: Endpoint = {
  path: '/users/google',
  method: 'post',
  handler: googleAuthHandler,
}
