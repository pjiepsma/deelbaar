import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView from 'react-native-map-clustering';
import { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Details } from 'react-native-maps/lib/MapView.types';
import { Region } from 'react-native-maps/lib/sharedTypes';

import Colors from '~/constants/Colors';
import { defaultStyles } from '~/constants/Styles';
import { useAuth } from '~/lib/AuthProvider';
import { Store, STORES_TABLE } from '~/lib/powersync/AppSchema';
import { useSystem } from '~/lib/powersync/PowerSync';
import { StoreEntry } from '~/lib/types/types';
import { uuid } from '~/lib/util/uuid';
// import { useBaseAuth } from '~/provider/AuthProvider';

// Todo Expo location to get the user location

interface Props {
  setListings: (state: Store[]) => void;
  listings: Store[];
  category: string;
}

// const INITIAL_REGION = {
//   latitude: 37.33,
//   longitude: -122,
//   latitudeDelta: 9,
//   longitudeDelta: 9,
// };

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const ListingsMap = memo(({ category, listings, setListings }: Props) => {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const { connector, db } = useSystem();
  const { user } = useAuth();
  const [region, setRegion] = useState<MapRegion>();

  const addGeoStore = async (info: StoreEntry) => {
    const location = await Location.getCurrentPositionAsync({});
    const todoId = uuid();
    const point = `POINT(${location.coords.longitude}, ${location.coords.latitude})`;
    const data = await db
      .insertInto(STORES_TABLE)
      .values({ id: todoId, name: info.name, description: info.description, location: point })
      .execute();

    if (data && info.image) {
      // // Upload the image to Supabase
      // const foo = await connector.storage
      //   .from('stores')
      //   .upload(`/images/${data.id}.png`, info.image);
    }
  };

  const loadStores = async () => {
    return await db.selectFrom(STORES_TABLE).selectAll().execute();
  };

  const getNearbyStores = async (lat: number = 52, long: number = 52) => {
    const { data, error } = await connector.client.rpc('nearby_stores', {
      lat,
      long,
    });
    return data;
  };

  const getStoresInView = async (
    min_lat: number,
    min_long: number,
    max_lat: number,
    max_long: number
  ) => {
    const { data } = await connector.client.rpc('stores_in_view', {
      min_lat,
      min_long,
      max_lat,
      max_long,
    });
    return data;
  };

  useEffect(() => {
    onLocateMe();
  }, []);

  const onLocateMe = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  const renderCluster = (cluster: any) => {
    const { id, geometry, onPress, properties } = cluster;

    const points = properties.point_count;
    return (
      <Marker
        key={`cluster-${id}`}
        coordinate={{
          longitude: geometry.coordinates[0],
          latitude: geometry.coordinates[1],
        }}
        onPress={onPress}>
        <View style={styles.marker}>
          <Text
            style={{
              color: '#000',
              textAlign: 'center',
              fontFamily: 'mon-sb',
            }}>
            {points}
          </Text>
        </View>
      </Marker>
    );
  };

  const handleRegionChangeComplete = async (region: Region, details: Details) => {
    const bounds = await mapRef.current?.getMapBoundaries();
    console.log('New bounds');
    const stores = await getStoresInView(
      bounds.southWest.latitude,
      bounds.southWest.longitude,
      bounds.northEast.latitude,
      bounds.northEast.longitude
    );
    setListings(stores);
  };

  const handleMarkerPress = (store: Store) => {
    router.push(`/listing/${store.id}`);
  };

  return (
    <View style={defaultStyles.container}>
      {region && (
        <MapView
          ref={mapRef}
          animationEnabled={false}
          style={StyleSheet.absoluteFillObject}
          onRegionChangeComplete={handleRegionChangeComplete}
          initialRegion={region}
          clusterColor="#fff"
          clusterTextColor="#000"
          clusterFontFamily="mon-sb"
          radius={40}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          showsMyLocationButton>
          {listings.map((store: any) => (
            <Marker
              coordinate={{
                longitude: store.long,
                latitude: store.lat,
              }}
              key={uuid()}
              onPress={() => handleMarkerPress(store)} // Handle marker press
            >
              <View style={styles.marker}>
                <Text style={styles.markerText}>{store.name}</Text>
              </View>
            </Marker>
          ))}
        </MapView>
      )}
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
  map: {
    width: '100%',
    height: '100%',
  },
  marker: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    elevation: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: {
      width: 1,
      height: 10,
    },
  },
  markerText: {
    fontSize: 14,
    fontFamily: 'mon-sb',
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
});

export default ListingsMap;
