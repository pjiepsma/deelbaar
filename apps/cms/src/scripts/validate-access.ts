import { getPayload } from 'payload'
import config from '@payload-config'

type AssertResult = {
  name: string
  ok: boolean
  details?: string
}

const results: AssertResult[] = []

function record(name: string, ok: boolean, details?: string): void {
  results.push({ name, ok, details })
  const icon = ok ? 'PASS' : 'FAIL'
  console.log(`[${icon}] ${name}${details ? ` - ${details}` : ''}`)
}

function relationId(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const idValue = (value as { id?: unknown }).id
    if (typeof idValue === 'string') return idValue
    if (typeof idValue === 'number') return String(idValue)
  }
  return null
}

async function expectThrows(name: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn()
    record(name, false, 'Expected access error but operation succeeded')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    record(name, true, message)
  }
}

async function main() {
  const payload = await getPayload({ config })

  const users = await payload.find({
    collection: 'users',
    limit: 20,
    depth: 0,
    overrideAccess: true,
  })

  const admin = users.docs.find((u) => u.role === 'admin')
  const userA = users.docs.find((u) => u.role === 'user')
  const userB = users.docs.find((u) => u.role === 'user' && u.id !== userA?.id)

  if (!admin || !userA || !userB) {
    throw new Error('Need at least one admin and two users from seed data.')
  }

  const places = await payload.find({
    collection: 'kiosks',
    limit: 5,
    depth: 0,
    overrideAccess: true,
  })

  const samplePlace = places.docs[0]
  if (!samplePlace) {
    throw new Error('Need at least one map place from seed data.')
  }
  const placeRef = { relationTo: 'kiosks', value: samplePlace.id }

  await expectThrows('Follows.create blocks anonymous', async () => {
    await payload.create({
      collection: 'follows',
      overrideAccess: false,
      data: {
        targetType: 'place',
        place: placeRef,
        active: true,
      },
    })
  })

  const followA = await payload.create({
    collection: 'follows',
    req: { user: userA } as never,
    overrideAccess: false,
    data: {
      targetType: 'place',
      place: placeRef,
      active: true,
    },
  })
  record('Follows.create allows authenticated user', !!followA?.id)

  const userAReadFollows = await payload.find({
    collection: 'follows',
    req: { user: userA } as never,
    overrideAccess: false,
    limit: 100,
    depth: 0,
  })
  const userAOwnOnly = userAReadFollows.docs.every((doc) => {
    const docUserId = relationId(doc.user)
    return docUserId === String(userA.id)
  })
  record(
    'Follows.read scopes results to current user',
    userAOwnOnly,
    `docs=${userAReadFollows.docs.length}`,
  )

  await expectThrows('Entitlements.create blocks regular user', async () => {
    await payload.create({
      collection: 'entitlements',
      req: { user: userA } as never,
      overrideAccess: false,
      data: {
        user: userA.id,
        scope: 'province',
        status: 'active',
        source: 'validation',
      },
    })
  })

  const entitlementForUserB = await payload.create({
    collection: 'entitlements',
    req: { user: admin } as never,
    overrideAccess: false,
    data: {
      user: userB.id,
      scope: 'country',
      status: 'active',
      source: 'validation-admin',
    },
  })
  record('Entitlements.create allows admin', !!entitlementForUserB?.id)

  const userAEntitlements = await payload.find({
    collection: 'entitlements',
    req: { user: userA } as never,
    overrideAccess: false,
    limit: 100,
    depth: 0,
  })
  const entitlementLeak = userAEntitlements.docs.some((doc) => {
    const docUserId = relationId(doc.user)
    return docUserId !== String(userA.id)
  })
  record(
    'Entitlements.read does not leak other users',
    !entitlementLeak,
    `docs=${userAEntitlements.docs.length}`,
  )

  const reportByUserA = await payload.create({
    collection: 'reports',
    req: { user: userA } as never,
    overrideAccess: false,
    data: {
      targetType: 'place',
      place: placeRef,
      reason: 'other',
      details: 'Validation report',
    },
  })
  record('Reports.create allows authenticated user', !!reportByUserA?.id)

  await expectThrows('Reports.update blocks regular user', async () => {
    await payload.update({
      collection: 'reports',
      id: reportByUserA.id,
      req: { user: userA } as never,
      overrideAccess: false,
      data: {
        status: 'resolved',
      },
    })
  })

  const updatedByAdmin = await payload.update({
    collection: 'reports',
    id: reportByUserA.id,
    req: { user: admin } as never,
    overrideAccess: false,
    data: {
      status: 'resolved',
      reviewedBy: admin.id,
      resolutionNote: 'Validated by admin test.',
    },
  })
  record(
    'Reports.update allows admin',
    updatedByAdmin.status === 'resolved',
    `status=${updatedByAdmin.status}`,
  )

  await payload.delete({
    collection: 'follows',
    id: followA.id,
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'entitlements',
    id: entitlementForUserB.id,
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'reports',
    id: reportByUserA.id,
    overrideAccess: true,
  })

  const failed = results.filter((r) => !r.ok)
  const passed = results.length - failed.length
  console.log(`\nAccess validation summary: ${passed}/${results.length} passed`)

  if (failed.length > 0) {
    throw new Error(`Access validation failed for ${failed.length} checks.`)
  }
}

await main()
