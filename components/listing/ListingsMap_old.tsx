import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Loader from '~/components/Loader';
import Colors from '~/constants/Colors';
import { defaultStyles } from '~/constants/Styles';
import { useAuth } from '~/lib/AuthProvider';
import { ListingRecord } from '~/lib/powersync/AppSchema';
import { useSystem } from '~/lib/powersync/PowerSync';

interface Props {
  setListings: (state: ListingRecord[]) => void;
  setListing: (state: ListingRecord) => void;
  listings: ListingRecord[];
}

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const ListingsMap_old = memo(({ listings, setListings, setListing }: Props) => {
  const mapRef = useRef<MapView | null>(null);
  const { connector } = useSystem();
  const { user } = useAuth();
  const [region, setRegion] = useState<MapRegion | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const previousRegionRef = useRef<MapRegion | null>(null);
  const SIGNIFICANT_CHANGE_THRESHOLD = 0.015;

  const getListingsInView = async (
    lat: number,
    long: number,
    minLat: number,
    minLong: number,
    maxLat: number,
    maxLong: number
  ): Promise<ListingRecord[]> => {
    const { data } = await connector.client.rpc('listings_with_distance', {
      min_lat: minLat,
      min_long: minLong,
      max_lat: maxLat,
      max_long: maxLong,
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
  ) => {
    return {
      minLat: latitude - latitudeDelta / 2,
      maxLat: latitude + latitudeDelta / 2,
      minLong: longitude - longitudeDelta / 2,
      maxLong: longitude + longitudeDelta / 2,
    };
  };

  useEffect(() => {
    onLocateMe();
  }, []);

  const onLocateMe = async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied');
      setLoading(false);
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    const newRegion: MapRegion = {
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
        const { minLat, maxLat, minLong, maxLong } = calculateBounds(
          latitude,
          longitude,
          latitudeDelta,
          longitudeDelta
        );
        const filteredListings = listings.filter(
          (store) =>
            store.lat >= minLat &&
            store.lat <= maxLat &&
            store.long >= minLong &&
            store.long <= maxLong
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
    const { coords } = await Location.getCurrentPositionAsync({});
    const stores = await getListingsInView(
      coords.latitude,
      coords.longitude,
      minLat,
      minLong,
      maxLat,
      maxLong
    );
    setListings(stores);
    setLoading(false);
    previousRegionRef.current = region;
  };

  const handleMarkerPress = (listing: ListingRecord) => {
    setListing(listing);
  };

  return (
    <View style={[defaultStyles.container]}>
      {region && (
        <MapView
          minZoomLevel={12}
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          onRegionChangeComplete={handleRegionChangeComplete}
          initialRegion={region}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          showsMyLocationButton={false}>
          {listings.map((store) => (
            <Marker
              key={store.id}
              coordinate={{ latitude: store.lat, longitude: store.long }}
              onPress={() => handleMarkerPress(store)}
              tracksViewChanges={false}>
              <View style={styles.marker}>
                <Ionicons name="library-outline" size={14} color={Colors.light} />
              </View>
            </Marker>
          ))}
        </MapView>
      )}
      <View style={styles.loaderContainer}>
        <Loader delay={200} amount={3} visible={loading} />
      </View>
      <TouchableOpacity style={[styles.locateBtn, { top: insets.top + 10 }]} onPress={onLocateMe}>
        <Ionicons name="navigate" size={24} color={Colors.dark} />
      </TouchableOpacity>
    </View>
  );
});

const commonShadowStyle = {
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 6,
  shadowOffset: {
    width: 1,
    height: 10,
  },
};

const styles = StyleSheet.create({
  marker: {
    flexDirection: 'row',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    elevation: 5,
    borderRadius: 8,
    ...commonShadowStyle,
  },
  locateBtn: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    elevation: 2,
    ...commonShadowStyle,
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

export default ListingsMap_old;
