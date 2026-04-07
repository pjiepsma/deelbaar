import * as Location from 'expo-location';
import { useCallback, useState, useRef } from 'react';

import { ListingRecord } from '../types/models';
import { FALLBACK_REGION, zoomToLatitudeDelta } from '../utils/mapUtils';
import type { Region } from '../utils/mapUtils';

export type MapboxMapRef = {
  flyTo: (center: [number, number], zoomLevel: number, animationDuration?: number) => void;
  animateToRegion?: (region: Region, duration?: number) => void;
};

interface UseMapViewOptions {
  onRegionChange?: (region: Region) => void;
  onListingSelect?: (listing: ListingRecord) => void;
}

/**
 * Hook to manage map view state and interactions
 * Handles region state, selected listing, user location, and map animations
 */
export function useMapView(options?: UseMapViewOptions) {
  const { onRegionChange, onListingSelect } = options || {};

  // UI state
  const [region, setRegion] = useState<Region>(FALLBACK_REGION);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );

  // Map ref (populated by MapViewWithMarkers)
  const mapRef = useRef<MapboxMapRef | null>(null);

  // Animate to region (converts Region to center + zoom for Mapbox)
  const animateToRegion = useCallback((nextRegion: Region, duration = 500) => {
    const zoom = Math.round(Math.log2(360 / nextRegion.latitudeDelta));
    const center: [number, number] = [nextRegion.longitude, nextRegion.latitude];
    mapRef.current?.flyTo(center, zoom, duration);
  }, []);

  // Locate user and center map
  const locateUser = useCallback(async () => {
    try {
      setRequestingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setRequestingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      const nextRegion: Region = {
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setUserLocation(userCoords);
      setRegion(nextRegion);
      animateToRegion(nextRegion);
    } catch (error) {
      console.warn('[useMapView] Failed to locate user', error);
    } finally {
      setRequestingLocation(false);
    }
  }, [animateToRegion]);

  // Handle region change completion
  const handleRegionChangeComplete = useCallback(
    (nextRegion: Region) => {
      // Update region immediately for instant filtering
      setRegion(nextRegion);
      if (onRegionChange) {
        onRegionChange(nextRegion);
      }
    },
    [onRegionChange]
  );

  // Handle listing selection
  const handleSelectListing = useCallback(
    (listing: ListingRecord) => {
      // Update selection
      setSelectedId(listing.id);
      if (onListingSelect) {
        onListingSelect(listing);
      }
    },
    [onListingSelect]
  );

  return {
    // State
    region,
    setRegion,
    selectedId,
    setSelectedId,
    userLocation,
    requestingLocation,
    // Refs
    mapRef,
    // Handlers
    animateToRegion,
    locateUser,
    handleRegionChangeComplete,
    handleSelectListing,
  };
}
