import * as Location from 'expo-location';
import { debounce } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';
import { Region } from 'react-native-maps/lib/sharedTypes';

import Loader from '~/components/Loader';
import MapWithMarkers from '~/components/map/molecules/MapWithMarkers';
import Colors from '~/constants/Colors';
import { useAuth } from '~/lib/AuthProvider';
import { ListingRecord } from '~/lib/powersync/AppSchema';
import { useSystem } from '~/lib/powersync/System';

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
  }) => void; // Added setRegionBounds prop
  category: string;
}

const ListingsMap: React.FC<Props> = ({
  listings,
  setListings,
  setListing,
  listing,
  setRegionBounds,
}) => {
  const { connector } = useSystem();
  const { user } = useAuth();
  const [region, setRegion] = useState<Region>();
  const [loading, setLoading] = useState<boolean>(false);
  const mapRef = useRef<MapView>(null); // Create ref for MapView

  const fetchedBoundsRef = useRef<{
    minLat: number;
    maxLat: number;
    minLong: number;
    maxLong: number;
  } | null>(null);

  // Function to calculate bounds from the current region
  const calculateBounds = (
    latitude: number,
    longitude: number,
    latitudeDelta: number,
    longitudeDelta: number
  ) => ({
    minLat: latitude - latitudeDelta / 2,
    maxLat: latitude + latitudeDelta / 2,
    minLong: longitude - longitudeDelta / 2,
    maxLong: longitude + longitudeDelta / 2,
  });

  // Function to fetch listings within a given view area
  const getListingsInView = async (
    lat: number,
    long: number,
    min_lat: number,
    min_long: number,
    max_lat: number,
    max_long: number,
    user_id: string | null = null
  ) => {
    try {
      const { data, error } = await connector.client.rpc('listings_in_view', {
        min_lat,
        min_long,
        max_lat,
        max_long,
        input_long: long,
        input_lat: lat,
        user_id,
      });

      if (error) {
        console.error('Error calling function:', error);
        throw error; // Optional: throw if you want to handle it elsewhere
      }

      return data;
    } catch (err) {
      console.error('Error in fetching listings:', err);
      return null; // Handle error as needed
    }
  };

  // Function to center the map on the user's current location and fetch listings
  const onLocateMe = async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLoading(false);
      alert('Permission to access location was denied');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    const newRegion = {
      latitude,
      longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setRegion(newRegion);

    const { minLat, maxLat, minLong, maxLong } = calculateBounds(
      latitude,
      longitude,
      newRegion.latitudeDelta,
      newRegion.longitudeDelta
    );

    const stores = await getListingsInView(
      latitude,
      longitude,
      minLat,
      minLong,
      maxLat,
      maxLong,
      user?.id
    );
    setListings(stores);
    setRegionBounds({ minLat, maxLat, minLong, maxLong }); // Update region bounds via the prop
    fetchedBoundsRef.current = { minLat, maxLat, minLong, maxLong }; // Store the fetched bounds
    setLoading(false);
  };

  useEffect(() => {
    onLocateMe();
  }, []);

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

    const { coords } = await Location.getCurrentPositionAsync({});
    const stores = await getListingsInView(
      coords.latitude,
      coords.longitude,
      minLat,
      minLong,
      maxLat,
      maxLong,
      user?.id
    );
    setListings(stores);
    fetchedBoundsRef.current = { minLat, maxLat, minLong, maxLong };

    setLoading(false);
  };

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
          selectedListingId={listing ? listing.id : null}
          onRegionChangeComplete={debounce(handleRegionChangeComplete, 500)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
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
