import * as Location from 'expo-location';
import { useCallback, useState, useRef } from 'react';
import MapView, { Region } from 'react-native-maps';

import { ListingRecord } from '../types/models';
import { FALLBACK_REGION } from '../utils/mapUtils';

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

  // Map ref
  const mapRef = useRef<MapView>(null);

  // Animate to region
  const animateToRegion = useCallback((nextRegion: Region) => {
    mapRef.current?.animateToRegion(nextRegion, 500);
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
