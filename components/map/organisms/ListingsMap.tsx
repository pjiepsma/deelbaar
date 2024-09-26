// organisms/ListingsMap.tsx
import * as Location from 'expo-location';
import { debounce } from 'lodash';
import React, { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Region } from 'react-native-maps/lib/sharedTypes';

import Loader from '~/components/Loader';
import LocateButton from '~/components/map/atom/Button';
import MapWithMarkers from '~/components/map/molecules/MapWithMarkers';
import Colors from '~/constants/Colors';
import { useAuth } from '~/lib/AuthProvider';
import { ListingRecord } from '~/lib/powersync/AppSchema';
import { useSystem } from '~/lib/powersync/PowerSync';

interface Props {
  setListings: (state: ListingRecord[]) => void;
  setListing: (state: ListingRecord) => void;
  listings: ListingRecord[];
  category: string;
}

const ListingsMap: React.FC<Props> = memo(({ category, listings, setListings, setListing }) => {
  const { connector } = useSystem();
  const { user } = useAuth();
  const [region, setRegion] = useState<Region>();
  const [loading, setLoading] = useState<boolean>(false);
  const previousRegionRef = useRef<Region | undefined>(undefined);
  const SIGNIFICANT_CHANGE_THRESHOLD = 0.015;

  const getListingsInView = async (
    lat: number,
    long: number,
    min_lat: number,
    min_long: number,
    max_lat: number,
    max_long: number
  ) => {
    const { data } = await connector.client.rpc('listings_with_distance', {
      min_lat,
      min_long,
      max_lat,
      max_long,
      input_long: long,
      input_lat: lat,
    });
    return data;
  };

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

  useEffect(() => {
    onLocateMe();
  }, []);

  const moveToUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied');
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    setRegion({
      latitude,
      longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  };

  const onLocateMe = async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLoading(false);
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

    previousRegionRef.current = newRegion;

    const { minLat, maxLat, minLong, maxLong } = calculateBounds(
      latitude,
      longitude,
      newRegion.latitudeDelta,
      newRegion.longitudeDelta
    );

    const stores = await getListingsInView(latitude, longitude, minLat, minLong, maxLat, maxLong);
    setListings(stores);
    setLoading(false);
  };

  const handleRegionChangeComplete = async (region: Region) => {
    if (!region) return;

    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    const prevRegion = previousRegionRef.current;

    if (prevRegion) {
      const latitudeChange = Math.abs(latitude - prevRegion.latitude);
      const longitudeChange = Math.abs(longitude - prevRegion.longitude);

      if (
        latitudeChange < SIGNIFICANT_CHANGE_THRESHOLD &&
        longitudeChange < SIGNIFICANT_CHANGE_THRESHOLD
      ) {
        const newMinLat = latitude - latitudeDelta / 2;
        const newMaxLat = latitude + latitudeDelta / 2;
        const newMinLong = longitude - longitudeDelta / 2;
        const newMaxLong = longitude + longitudeDelta / 2;

        const filteredListings = listings.filter(
          (store) =>
            store.lat >= newMinLat &&
            store.lat <= newMaxLat &&
            store.long >= newMinLong &&
            store.long <= newMaxLong
        );

        setListings(filteredListings);
        return;
      }
    }

    setLoading(true);
    const { minLat, maxLat, minLong, maxLong } = calculateBounds(
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta
    );

    const { coords } = await Location.getCurrentPositionAsync();
    const newStores = await getListingsInView(
      coords.latitude,
      coords.longitude,
      minLat,
      minLong,
      maxLat,
      maxLong
    );
    setListings(newStores);
    setRegion(region);
    previousRegionRef.current = region;
    setLoading(false);
  };

  const handleMarkerPress = (store: any) => {
    setListing(store);
  };

  return (
    <View style={styles.container}>
      <View style={styles.loaderContainer}>
        <Loader delay={200} amount={3} visible={loading} />
      </View>
      {region && (
        <MapWithMarkers
          region={region}
          listings={listings}
          onMarkerPress={handleMarkerPress}
          onRegionChangeComplete={debounce(handleRegionChangeComplete, 300)}
        />
      )}
      <LocateButton onPress={moveToUserLocation} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    pointerEvents: 'box-none', // Allows touch events to pass through
  },
});

export default ListingsMap;
