import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { debounce } from 'lodash';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Region } from 'react-native-maps/lib/sharedTypes';

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
  category: string;
}

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MarkerComponentProps {
  store: ListingRecord;
  onPress: () => void;
}

const MarkerComponent: React.FC<MarkerComponentProps> = memo(({ store, onPress }) => (
  <Marker
    coordinate={{ latitude: store.lat, longitude: store.long }}
    onPress={onPress}
    tracksViewChanges={false}>
    <View style={styles.marker}>
      <Ionicons name="library-outline" size={14} color={Colors.light} />
    </View>
  </Marker>
));

const ListingsMap = memo(({ category, listings, setListings, setListing }: Props) => {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const { connector } = useSystem();
  const { user } = useAuth();
  const [region, setRegion] = useState<MapRegion>();
  const [loading, setLoading] = useState<boolean>(false);

  const getListingsInView = async (
    lat: number,
    long: number,
    min_lat: number,
    min_long: number,
    max_lat: number,
    max_long: number
  ) => {
    const { data } = await connector.client.rpc('listings_in_view', {
      lat,
      long,
      min_lat,
      min_long,
      max_lat,
      max_long,
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
    setLoading(true); // Start loading when locating the user
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLoading(false); // Stop loading if permission is not granted
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const latitude = location.coords.latitude;
    const longitude = location.coords.longitude;

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

    const stores = await getListingsInView(latitude, longitude, minLat, minLong, maxLat, maxLong);
    setListings(stores);
    setLoading(false); // Stop loading after fetching
  };

  const handleRegionChangeComplete = async (region: Region) => {
    if (!region) return;

    setLoading(true); // Start loading when region changes
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;

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
    setLoading(false); // Stop loading after fetching
  };

  const debounceRegionChangeComplete = useCallback(debounce(handleRegionChangeComplete, 1000), []);

  const handleMarkerPress = (listing: ListingRecord) => {
    setListing(listing);
  };

  return (
    <View style={defaultStyles.container}>
      {region && (
        <MapView
          minZoomLevel={12}
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          onRegionChangeComplete={debounceRegionChangeComplete}
          initialRegion={region}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          showsMyLocationButton>
          {listings.map((store) => (
            <MarkerComponent
              key={store.id}
              store={store}
              onPress={() => handleMarkerPress(store)}
            />
          ))}
        </MapView>
      )}
      <View style={styles.loaderContainer}>
        <Loader delay={200} amount={3} visible={loading} />
      </View>
      <TouchableOpacity style={styles.locateBtn} onPress={onLocateMe}>
        <Ionicons name="navigate" size={24} color={Colors.dark} />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  marker: {
    flexDirection: 'row',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    elevation: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: {
      width: 1,
      height: 10,
    },
  },
  locateBtn: {
    position: 'absolute',
    top: 70,
    right: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: {
      width: 1,
      height: 10,
    },
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.dark,
    fontWeight: '600',
  },
});

export default ListingsMap;
