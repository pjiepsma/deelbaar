import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Region } from 'react-native-maps';

import { useListingsInBounds, LISTINGS_MAP_SELECT, Bounds } from './useLocationQueries';
import { ListingRecord } from '../types/models';
import { FETCH_MARGIN_MULTIPLIER } from '../utils/mapUtils';

/**
 * Hook to manage map data fetching and caching
 * Handles bounds calculation, overlap detection, and listing caching
 */
export function useMapData(region: Region) {
  const [cachedListings, setCachedListings] = useState<ListingRecord[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Track last fetched bounds (to avoid refetching overlapping areas)
  const lastFetchedBounds = useRef<Bounds | null>(null);

  // Calculate bounds for fetching - use larger area with margin to preload listings
  // outside visible viewport to prevent visible loading when user pans/zooms
  const currentBounds = useMemo(() => {
    // Add margin: fetch listings from a larger area than visible
    // This ensures listings are already loaded before they become visible on screen
    const latHalf = (region.latitudeDelta / 2) * (1 + FETCH_MARGIN_MULTIPLIER * 2);
    const lonHalf = (region.longitudeDelta / 2) * (1 + FETCH_MARGIN_MULTIPLIER * 2);

    return {
      northEast: {
        lat: region.latitude + latHalf,
        lon: region.longitude + lonHalf,
      },
      southWest: {
        lat: region.latitude - latHalf,
        lon: region.longitude - lonHalf,
      },
    };
  }, [region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]);

  // Fetch listings - manual control
  const { refetch: fetchListings } = useListingsInBounds(currentBounds, {
    enabled: false, // Manual control
    select: LISTINGS_MAP_SELECT, // Only fetch necessary fields
  });

  // Helper function to check if current bounds overlap enough with fetched bounds
  const boundsOverlapEnough = useCallback((current: Bounds, fetched: Bounds): boolean => {
    // Check if current bounds are fully contained within fetched bounds
    const isFullyContained =
      current.southWest.lat >= fetched.southWest.lat &&
      current.northEast.lat <= fetched.northEast.lat &&
      current.southWest.lon >= fetched.southWest.lon &&
      current.northEast.lon <= fetched.northEast.lon;

    if (isFullyContained) return true;

    // Calculate overlap area (simplified: check if centers are close and areas overlap)
    // If more than 50% of current bounds area is outside fetched bounds, we need to fetch
    const currentLatSpan = current.northEast.lat - current.southWest.lat;
    const currentLonSpan = current.northEast.lon - current.southWest.lon;
    const currentArea = currentLatSpan * currentLonSpan;

    // Calculate overlapping bounds
    const overlapSouthWest = {
      lat: Math.max(current.southWest.lat, fetched.southWest.lat),
      lon: Math.max(current.southWest.lon, fetched.southWest.lon),
    };
    const overlapNorthEast = {
      lat: Math.min(current.northEast.lat, fetched.northEast.lat),
      lon: Math.min(current.northEast.lon, fetched.northEast.lon),
    };

    // Check if there's any overlap
    if (
      overlapSouthWest.lat >= overlapNorthEast.lat ||
      overlapSouthWest.lon >= overlapNorthEast.lon
    ) {
      return false; // No overlap at all
    }

    const overlapLatSpan = overlapNorthEast.lat - overlapSouthWest.lat;
    const overlapLonSpan = overlapNorthEast.lon - overlapSouthWest.lon;
    const overlapArea = overlapLatSpan * overlapLonSpan;

    // If overlap covers less than 50% of current bounds, we need to fetch
    return overlapArea / currentArea >= 0.5;
  }, []);

  // Fetch when bounds change and don't overlap enough with previously fetched bounds
  useEffect(() => {
    const shouldFetch = () => {
      // Always fetch if we have no listings
      if (cachedListings.length === 0) return true;

      // Always fetch if we haven't fetched before
      if (!lastFetchedBounds.current) return true;

      // Check if current bounds overlap enough with fetched bounds
      return !boundsOverlapEnough(currentBounds, lastFetchedBounds.current);
    };

    if (shouldFetch()) {
      setIsInitialLoading(true);
      fetchListings()
        .then((result) => {
          const data = result.data as { docs: ListingRecord[] } | undefined;
          if (data?.docs) {
            // Merge new listings with existing (dedupe by id)
            const merged = [...cachedListings];
            data.docs.forEach((newListing) => {
              if (!merged.find((l) => l.id === newListing.id)) {
                merged.push(newListing);
              }
            });
            setCachedListings(merged);
            // Update fetched bounds
            lastFetchedBounds.current = {
              northEast: { ...currentBounds.northEast },
              southWest: { ...currentBounds.southWest },
            };
          }
        })
        .catch((error) => {
          console.error('Error fetching listings:', error);
        })
        .finally(() => {
          setIsInitialLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBounds, cachedListings.length, boundsOverlapEnough, fetchListings]);

  return {
    cachedListings,
    isInitialLoading,
    refetch: fetchListings,
  };
}


