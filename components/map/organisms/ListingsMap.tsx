import * as Location from 'expo-location';
import { debounce } from 'lodash';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';
import { Region } from 'react-native-maps/lib/sharedTypes';

import Loader from '~/components/Loader';
import MapWithMarkers from '~/components/map/molecules/MapWithMarkers';
import Colors from '~/constants/Colors';
import { useAuth } from '~/lib/AuthProvider';
import { ListingRecord } from '~/lib/powersync/AppSchema';
import { useSystem } from '~/lib/powersync/PowerSync';
import { SelectLatestImages } from '~/lib/powersync/Queries';
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
  const { connector, powersync } = useSystem();
  const { user } = useAuth();
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<MapView>(null);
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
        const { data: listings, error } = await connector.client.rpc('listings_in_view', {
          ...params,
        });

        if (error) {
          console.error('Error fetching listings:', error);
          return [];
        }

        const listingIds = listings.map((l: ListingRecord) => l.id);
        const sql = SelectLatestImages(listingIds);
        const pictures: PictureEntry[] = await powersync.getAll(sql, listingIds);

        return listings.map((listing: ListingRecord) => ({
          ...listing,
          picture: pictures.find((pic) => pic.listing_id === listing.id) || null,
        }));
      } catch (err) {
        console.error('Error in fetchListingsWithPictures:', err);
        return [];
      }
    },
    [connector, powersync]
  );

  const handleLocationPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied');
      return null;
    }
    return await Location.getCurrentPositionAsync({});
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

    const bounds = calculateBounds(latitude, longitude, 0.05, 0.05);
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

  const handleRegionChangeComplete = useCallback(
    async (region: Region) => {
      if (!region) return;

      const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
      const bounds = calculateBounds(latitude, longitude, latitudeDelta, longitudeDelta);

      if (fetchedBoundsRef.current) {
        const { minLat, maxLat, minLong, maxLong } = fetchedBoundsRef.current;
        const isWithinBounds =
          bounds.minLat >= minLat &&
          bounds.maxLat <= maxLat &&
          bounds.minLong >= minLong &&
          bounds.maxLong <= maxLong;
        if (isWithinBounds) return;
      }

      setLoading(true);
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
      fetchedBoundsRef.current = bounds;
      setRegionBounds(bounds);
      setLoading(false);
    },
    [calculateBounds, fetchListingsWithPictures, setListings, setRegionBounds, user?.id]
  );

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
