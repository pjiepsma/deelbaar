// PowerSync removed - using custom offline-first solution
import * as Location from 'expo-location';
import { debounce } from 'lodash';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import Loader from '~/components/shared/Loader';
import MapWithMarkers, { MapWithMarkersRef } from '~/components/map/molecules/MapWithMarkers';
import type { Region } from '~/lib/utils/mapUtils';
import Colors from '~/constants/Colors';
import { useListings } from '~/lib/hooks/usePayloadQuery';
import { useAuth } from '~/lib/providers/AuthProvider';
import { useUser } from '~/lib/providers/UserProvider';
import { ListingRecord } from '~/lib/types/models';
import { PictureEntry } from '~/lib/types/types';

interface Props {
  setListings: (state: ListingRecord[]) => void;
  setListing: (state: ListingRecord) => void;
  listing: ListingRecord | null;
  listings: ListingRecord[];
  setRegionBounds: (bounds: {
    minLat: number;
    maxLat: number;
    minLong: number;
    maxLong: number;
  }) => void;
  category: string;
}

const ListingsMap: React.FC<Props> = ({
  listings,
  setListings,
  setListing,
  listing,
  setRegionBounds,
}) => {
  const { setLocation } = useUser();
  const { user } = useAuth();
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<MapWithMarkersRef>(null);

  const fetchedBoundsRef = useRef<{
    minLat: number;
    maxLat: number;
    minLong: number;
    maxLong: number;
  } | null>(null);

  const calculateBounds = useCallback(
    (latitude: number, longitude: number, latDelta: number, longDelta: number) => ({
      minLat: latitude - latDelta / 2,
      maxLat: latitude + latDelta / 2,
      minLong: longitude - longDelta / 2,
      maxLong: longitude + longDelta / 2,
    }),
    []
  );

  // Fetch listings with pictures from Payload API
  const { data: allListings, isLoading: listingsLoading } = useListings();

  const fetchListingsWithPictures = useCallback(
    async (params: {
      input_lat: number;
      input_long: number;
      min_lat: number;
      min_long: number;
      max_lat: number;
      max_long: number;
      user_id: string | null;
    }) => {
      try {
        // Filter listings to those in view
        const filtered =
          allListings?.filter((listing: any) => {
            if (!listing.location?.coordinates) return false;
            const [lon, lat] = listing.location.coordinates;
            return (
              lat >= params.min_lat &&
              lat <= params.max_lat &&
              lon >= params.min_long &&
              lon <= params.max_long
            );
          }) || [];

        return filtered;
      } catch (err) {
        console.error('Error in fetchListingsWithPictures:', err);
        return [];
      }
    },
    [allListings]
  );

  const handleLocationPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied');
      return null;
    }

    return await Location.getCurrentPositionAsync({});
  }, []);

  const onForegroundUpdate = useCallback(async () => {
    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 1,
      },
      (location) => {
        setLocation(location);
      }
    );
  }, []);

  useEffect(() => {
    onForegroundUpdate();
  }, []);

  const locateUser = useCallback(async () => {
    setLoading(true);
    const location = await handleLocationPermission();
    if (!location) {
      setLoading(false);
      return;
    }

    const { latitude, longitude } = location.coords;
    const newRegion = {
      latitude,
      longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };

    setRegion(newRegion);

    const bounds = calculateBounds(
      latitude,
      longitude,
      newRegion.latitudeDelta,
      newRegion.longitudeDelta
    );
    const listings = await fetchListingsWithPictures({
      min_lat: bounds.minLat,
      max_lat: bounds.maxLat,
      min_long: bounds.minLong,
      max_long: bounds.maxLong,
      input_lat: latitude,
      input_long: longitude,
      user_id: user?.id ?? null,
    });

    setListings(listings);
    setRegionBounds(bounds);
    fetchedBoundsRef.current = bounds;
    setLoading(false);
  }, [
    handleLocationPermission,
    calculateBounds,
    fetchListingsWithPictures,
    setListings,
    setRegionBounds,
    user?.id,
  ]);

  const handleRegionChangeComplete = async (region: Region) => {
    if (!region) return;

    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    const { minLat, maxLat, minLong, maxLong } = calculateBounds(
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta
    );
    setRegionBounds({ minLat, maxLat, minLong, maxLong });

    if (fetchedBoundsRef.current) {
      const {
        minLat: fetchedMinLat,
        maxLat: fetchedMaxLat,
        minLong: fetchedMinLong,
        maxLong: fetchedMaxLong,
      } = fetchedBoundsRef.current;

      const isWithinFetchedBounds =
        minLat >= fetchedMinLat &&
        maxLat <= fetchedMaxLat &&
        minLong >= fetchedMinLong &&
        maxLong <= fetchedMaxLong;

      if (isWithinFetchedBounds) {
        return;
      }
    }
    setLoading(true);

    const listings = await fetchListingsWithPictures({
      min_lat: minLat,
      max_lat: maxLat,
      min_long: minLong,
      max_long: maxLong,
      input_lat: latitude,
      input_long: longitude,
      user_id: user?.id ?? null,
    });
    setListings(listings);
    fetchedBoundsRef.current = { minLat, maxLat, minLong, maxLong };
    setRegionBounds({ minLat, maxLat, minLong, maxLong });
    setLoading(false);
  };

  useEffect(() => {
    locateUser();
  }, [locateUser]);

  return (
    <View style={styles.container}>
      <View style={styles.loaderContainer}>
        <Loader delay={200} amount={3} visible={loading} />
      </View>
      {region && (
        <MapWithMarkers
          ref={mapRef}
          region={region}
          listings={listings}
          onMarkerPress={setListing}
          selectedListingId={listing?.id || null}
          onRegionChangeComplete={debounce(handleRegionChangeComplete, 500)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 30,
    backgroundColor: Colors.light,
  },
  loaderContainer: {
    position: 'absolute',
    zIndex: 1,
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
});

export default ListingsMap;
