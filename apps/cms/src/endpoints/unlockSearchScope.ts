type SearchScope = 'province' | 'country' | 'world'

const json = (body: object, init?: ResponseInit): Response => {
  const headers = new Headers(init?.headers)
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  return new Response(JSON.stringify(body), { ...init, headers })
}

export const unlockSearchScope = async (req: any) => {
  try {
    const user = req.user as { id?: string } | undefined
    if (!user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (req as { body?: { scope?: string } }).body
    const scope = normalizeScope(body?.scope)
    if (!scope) {
      return json({ error: 'Invalid scope' }, { status: 400 })
    }

    const current = await req.payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 0,
    })

    const nextSearchAccess = {
      province: !!current?.searchAccess?.province,
      country: !!current?.searchAccess?.country,
      world: !!current?.searchAccess?.world,
      [scope]: true,
    }

    const updated = await req.payload.update({
      collection: 'users',
      id: user.id,
      data: { searchAccess: nextSearchAccess },
      depth: 0,
    })

    return json({
      ok: true,
      searchAccess: updated.searchAccess ?? nextSearchAccess,
    })
  } catch (error) {
    console.error('unlockSearchScope failed', error)
    return json({ error: 'Failed to unlock scope' }, { status: 500 })
  }
}

function normalizeScope(value: unknown): SearchScope | null {
  if (value === 'province' || value === 'country' || value === 'world') return value
  return null
}
