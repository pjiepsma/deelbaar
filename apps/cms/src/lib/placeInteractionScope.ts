import { findPlaceByReference } from './mapPlaces'
import type { PayloadRequest } from 'payload'

type InteractionRequest = Pick<PayloadRequest, 'payload' | 'user'>
type InteractionRequestWithOptionalUser = Omit<InteractionRequest, 'user'> & {
  user?: InteractionRequest['user']
}

export type InteractionScope = 'city' | 'province' | 'country' | 'world'

type InteractionContext = {
  isAuthenticated: boolean
  maxUnlockedScope: InteractionScope | null
  homeArea: {
    city: string | null
    province: string | null
    country: string | null
  } | null
}

type PlaceLocation = {
  city?: unknown
  province?: unknown
  country?: unknown
}

const SCOPE_ORDER: Record<InteractionScope, number> = {
  city: 0,
  province: 1,
  country: 2,
  world: 3,
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return null
  }
  return trimmed.toLowerCase()
}

function highestScope(scopes: InteractionScope[]): InteractionScope {
  return scopes.reduce((current, candidate) => {
    if (SCOPE_ORDER[candidate] > SCOPE_ORDER[current]) {
      return candidate
    }
    return current
  }, 'city')
}

function isEntitlementActive(entitlement: Record<string, unknown>, now: Date): boolean {
  const status = entitlement.status
  if (status !== 'active') {
    return false
  }
  const expiresAt = entitlement.expiresAt
  if (typeof expiresAt !== 'string') {
    return true
  }
  const parsed = new Date(expiresAt)
  if (Number.isNaN(parsed.getTime())) {
    return false
  }
  return parsed.getTime() > now.getTime()
}

async function buildInteractionContext(req: InteractionRequestWithOptionalUser): Promise<InteractionContext> {
  if (!req.user) {
    return {
      isAuthenticated: false,
      maxUnlockedScope: null,
      homeArea: null,
    }
  }

  if (req.user.role === 'admin') {
    return {
      isAuthenticated: true,
      maxUnlockedScope: 'world',
      homeArea: null,
    }
  }

  const userDoc = await req.payload.findByID({
    collection: 'users',
    id: req.user.id,
    depth: 0,
    overrideAccess: true,
  }) as {
    searchAccess?: { province?: boolean | null; country?: boolean | null; world?: boolean | null }
    homeArea?: { city?: string | null; province?: string | null; country?: string | null }
  }

  const unlockedScopes: InteractionScope[] = ['city']
  if (userDoc.searchAccess?.province) {
    unlockedScopes.push('province')
  }
  if (userDoc.searchAccess?.country) {
    unlockedScopes.push('country')
  }
  if (userDoc.searchAccess?.world) {
    unlockedScopes.push('world')
  }

  const activeEntitlements = await req.payload.find({
    collection: 'entitlements',
    where: {
      user: {
        equals: req.user.id,
      },
    },
    depth: 0,
    limit: 100,
    overrideAccess: true,
  })

  const now = new Date()
  for (const entitlement of activeEntitlements.docs as Record<string, unknown>[]) {
    if (!isEntitlementActive(entitlement, now)) {
      continue
    }
    const scope = entitlement.scope
    if (scope === 'city' || scope === 'province' || scope === 'country' || scope === 'world') {
      unlockedScopes.push(scope)
    }
  }

  return {
    isAuthenticated: true,
    maxUnlockedScope: highestScope(unlockedScopes),
    homeArea: {
      city: normalizeText(userDoc.homeArea?.city),
      province: normalizeText(userDoc.homeArea?.province),
      country: normalizeText(userDoc.homeArea?.country),
    },
  }
}

function requiredScopeForPlace(
  placeLocation: PlaceLocation | undefined,
  homeArea: InteractionContext['homeArea'],
): InteractionScope {
  if (!homeArea) {
    return 'world'
  }

  const placeCountry = normalizeText(placeLocation?.country)
  const placeProvince = normalizeText(placeLocation?.province)
  const placeCity = normalizeText(placeLocation?.city)

  if (!homeArea.country || !placeCountry || placeCountry !== homeArea.country) {
    return 'world'
  }
  if (!homeArea.province || !placeProvince || placeProvince !== homeArea.province) {
    return 'country'
  }
  if (!homeArea.city || !placeCity || placeCity !== homeArea.city) {
    return 'province'
  }
  return 'city'
}

export type PlaceInteractionContract = {
  canInteract: boolean
  canOpenDetails: boolean
  canFavorite: boolean
  canFollow: boolean
  canRequest: boolean
  canReceiveNotifications: boolean
  reason: 'ok' | 'auth_required' | 'outside_unlocked_scope'
  maxUnlockedScope: InteractionScope | null
  requiredScope: InteractionScope | null
}

export async function getPlaceInteractionContract(
  req: InteractionRequestWithOptionalUser,
  place: Record<string, unknown>,
): Promise<PlaceInteractionContract> {
  const context = await buildInteractionContext(req)

  if (!context.isAuthenticated || !context.maxUnlockedScope) {
    return {
      canInteract: false,
      canOpenDetails: false,
      canFavorite: false,
      canFollow: false,
      canRequest: false,
      canReceiveNotifications: false,
      reason: 'auth_required',
      maxUnlockedScope: context.maxUnlockedScope,
      requiredScope: null,
    }
  }

  const requiredScope = requiredScopeForPlace(
    (place.location && typeof place.location === 'object' ? place.location : undefined) as PlaceLocation | undefined,
    context.homeArea,
  )
  const canInteract = SCOPE_ORDER[context.maxUnlockedScope] >= SCOPE_ORDER[requiredScope]

  return {
    canInteract,
    canOpenDetails: canInteract,
    canFavorite: canInteract,
    canFollow: canInteract,
    canRequest: canInteract,
    canReceiveNotifications: canInteract,
    reason: canInteract ? 'ok' : 'outside_unlocked_scope',
    maxUnlockedScope: context.maxUnlockedScope,
    requiredScope,
  }
}

export async function assertPlaceInteractionAllowed(
  req: InteractionRequestWithOptionalUser,
  placeReference: unknown,
  actionLabel: string,
): Promise<void> {
  if (!req.user) {
    throw new Error(`${actionLabel} requires authentication`)
  }
  if (req.user.role === 'admin') {
    return
  }

  const placeDoc = await findPlaceByReference(req.payload, placeReference)
  const contract = await getPlaceInteractionContract(req, placeDoc)
  if (!contract.canInteract) {
    throw new Error(
      `${actionLabel} blocked: place is outside unlocked entitlement scope (max=${String(
        contract.maxUnlockedScope,
      )}, required=${String(contract.requiredScope)})`,
    )
  }
}
