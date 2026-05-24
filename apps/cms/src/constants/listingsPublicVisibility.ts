import type { Where } from 'payload'

const MAP_PLACE_PUBLISH_STATUS_LIVE = 'live' as const

export const liveNonDeletedPlaceClauses: Where[] = [
  { publishStatus: { equals: MAP_PLACE_PUBLISH_STATUS_LIVE } },
  { deletedAt: { exists: false } },
]

/** Map and public discovery: live places that are not soft-deleted. */
export const LIVE_NON_DELETED_PLACE_WHERE: Where = {
  and: liveNonDeletedPlaceClauses,
}
