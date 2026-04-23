import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';

import { payloadClient } from '../api/PayloadClient';
import type { SearchScope } from './useSearchAccess';

export interface Bounds {
  northEast: { lat: number; lon: number };
  southWest: { lat: number; lon: number };
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Minimal field selection for map/carousel display
 * Only fetches fields needed for rendering and filtering
 */
export const LISTINGS_MAP_SELECT = {
  id: true,
  name: true,
  description: true,
  category: true,
  location: {
    coordinates: true,
    address: true,
  },
  pictures: {
    photo: true,
  },
};

/**
 * Get user's current location
 */
export function useCurrentLocation() {
  return useQuery({
    queryKey: ['currentLocation'],
    queryFn: async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

/**
 * Get listings near a specific location
 */
export function useNearbyListings(
  location: LocationCoordinates | null,
  options?: {
    radius?: number; // in meters, default 50000 (50km)
    limit?: number;
    enabled?: boolean;
    scope?: SearchScope;
  }
) {
  const { radius = 50000, limit = 100, enabled = true, scope = 'city' } = options || {};

  return useQuery({
    queryKey: ['listings', 'nearby', location?.latitude, location?.longitude, radius, limit, scope],
    queryFn: async () => {
      if (!location) return { docs: [], totalDocs: 0 };

      const params = new URLSearchParams({
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        radius: radius.toString(),
        limit: limit.toString(),
        scope,
      });

      const { data, error } = await payloadClient.request(
        `/api/listings/nearby?${params.toString()}`
      );

      if (error) {
        if (error.networkError || error.backendUnavailable) {
          console.warn(
            '[useNearbyListings] No minibiebs loaded — request never reached CMS (see BACKEND UNAVAILABLE log above). Map stays empty until the API is reachable.'
          );
        }
        throw new Error(error.message || 'Nearby listings request failed');
      }

      return data;
    },
    enabled: enabled && !!location,
    staleTime: 1000 * 60 * 2, // 2 minutes
    /** GPS jitter changes queryKey; without this, `data` is briefly undefined and map code clears listings. */
    placeholderData: keepPreviousData,
  });
}

/**
 * Get listings within map bounds (viewport)
 */
export function useListingsInBounds(
  bounds: Bounds | null,
  options?: {
    limit?: number;
    enabled?: boolean;
    select?: any;
  }
) {
  const { limit = 1000, enabled = true, select } = options || {};

  return useQuery({
    queryKey: ['listings', 'bounds', bounds?.northEast, bounds?.southWest, limit, select],
    queryFn: async () => {
      if (!bounds) return { docs: [], totalDocs: 0 };

      const params = new URLSearchParams({
        northEast: `${bounds.northEast.lat},${bounds.northEast.lon}`,
        southWest: `${bounds.southWest.lat},${bounds.southWest.lon}`,
        limit: limit.toString(),
      });

      if (select) {
        params.append('select', JSON.stringify(select));
      }

      const { data, error } = await payloadClient.request(
        `/api/listings/bounds?${params.toString()}`
      );

      if (error) throw new Error(error.message);

      return data;
    },
    enabled: enabled && !!bounds,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to automatically fetch nearby listings based on user location
 */
export function useNearbyListingsAuto(radius?: number) {
  const scope: SearchScope = 'city';
  const { data: location, isLoading: locationLoading } = useCurrentLocation();
  const {
    data: listings,
    isLoading: listingsLoading,
    isError: listingsError,
  } = useNearbyListings(location || null, {
    radius,
    enabled: !!location,
    scope,
  });

  return {
    listings: listings?.docs || [],
    totalDocs: listings?.totalDocs || 0,
    location,
    isLoading: locationLoading,
    isListingsLoading: listingsLoading,
    hasListingsError: listingsError,
  };
}

/**
 * Calculate distance between two points (in kilometers)
 */
export function calculateDistance(from: LocationCoordinates, to: LocationCoordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(distanceInKm: number): string {
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)}m`;
  }
  if (distanceInKm < 10) {
    return `${distanceInKm.toFixed(1)}km`;
  }
  return `${Math.round(distanceInKm)}km`;
}





