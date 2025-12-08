import { ListingRecord } from '../types/models';

/**
 * Resolve the owner ID from a listing
 * Handles both direct owner reference and nested owner object
 */
export function resolveOwnerId(listing: ListingRecord): string | null {
  const owner = listing.owner;
  if (!owner) return null;

  if (typeof owner === 'string') {
    return owner;
  }
  if (typeof owner === 'object' && owner.id) {
    return owner.id as string;
  }
  return null;
}

/**
 * Check if the current user is the owner of a listing
 */
export function isListingOwner(listing: ListingRecord, userId: string | null): boolean {
  if (!userId) return false;
  const ownerId = resolveOwnerId(listing);
  return ownerId === userId;
}


