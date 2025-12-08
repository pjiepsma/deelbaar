import { Region } from 'react-native-maps';

import { payloadClient } from '../api/PayloadClient';
import { ListingRecord } from '../types/models';

/**
 * Fallback region for the map (default location)
 */
export const FALLBACK_REGION: Region = {
  latitude: 52.0907,
  longitude: 5.1214,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

/**
 * Margin multiplier for fetching listings outside visible viewport
 * This ensures listings are preloaded before they become visible (no loading visible to user)
 */
export const FETCH_MARGIN_MULTIPLIER = 2.0; // Fetch 2x the visible area (100% margin on each side = 5x total area)

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Extract first approved image URL from listing pictures
 */
export function getFirstImageUrl(listing: ListingRecord): string | null {
  const pictures = listing.pictures || [];
  const approvedPictures = pictures.filter((pic: any) => pic.status === 'approved');
  if (approvedPictures.length === 0) return null;

  const firstPic = approvedPictures[0];
  const mediaId = typeof firstPic.photo === 'string' ? firstPic.photo : firstPic.photo?.id;
  return mediaId ? payloadClient.getFileUrl(mediaId) : null;
}


