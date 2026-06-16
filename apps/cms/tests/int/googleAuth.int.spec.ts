import { handleEndpoints } from 'payload'
import config from '@/payload.config'
import { describe, expect, it } from 'vitest'

const GOOGLE_AUTH_URL = 'http://localhost:4000/api/users/google'

async function postGoogleAuth(body: string): Promise<Response> {
  const request = new Request(GOOGLE_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  return handleEndpoints({
    config,
    request,
    path: '/api/users/google',
  })
}

async function readErrorBody(response: Response): Promise<{ error?: string; errors?: Array<{ message?: string }> }> {
  return (await response.json()) as { error?: string; errors?: Array<{ message?: string }> }
}

describe('POST /api/users/google', () => {
  it('returns 401 for fake idToken after body parse', async () => {
    const response = await postGoogleAuth(JSON.stringify({ idToken: 'fake-token-abc' }))

    expect(response.status).toBe(401)
    const body = await readErrorBody(response)
    expect(body.error).toBe('Invalid Google token.')
    expect(body.error).not.toBe('Missing idToken.')
  })

  it('returns 400 Missing idToken when field is absent', async () => {
    const response = await postGoogleAuth(JSON.stringify({}))

    expect(response.status).toBe(400)
    const body = await readErrorBody(response)
    expect(body.error).toBe('Missing idToken.')
  })

  it('returns 400 Missing idToken when idToken is wrong type', async () => {
    const response = await postGoogleAuth(JSON.stringify({ idToken: 123 }))

    expect(response.status).toBe(400)
    const body = await readErrorBody(response)
    expect(body.error).toBe('Missing idToken.')
  })

  it('returns 400 Invalid JSON for malformed body', async () => {
    const response = await postGoogleAuth('{ invalid')

    expect(response.status).toBe(400)
    const body = await readErrorBody(response)
    const message = body.error ?? body.errors?.[0]?.message
    expect(message).toBe('Invalid JSON')
  })
})
