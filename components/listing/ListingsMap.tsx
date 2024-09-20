import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { debounce } from 'lodash';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView from 'react-native-map-clustering';
import { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Details } from 'react-native-maps/lib/MapView.types';
import { Region } from 'react-native-maps/lib/sharedTypes';

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

const ListingsMap = memo(({ category, listings, setListings, setListing }: Props) => {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const { connector } = useSystem();
  const { user } = useAuth();
  const [region, setRegion] = useState<MapRegion>();

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

  const handleRegionChangeComplete = async (region: Region, details: Details) => {
    const bounds = await mapRef.current?.getMapBoundaries();
    const { coords } = await Location.getCurrentPositionAsync({});
    const stores = await getListingsInView(
      coords.latitude,
      coords.longitude,
      bounds.southWest.latitude,
      bounds.southWest.longitude,
      bounds.northEast.latitude,
      bounds.northEast.longitude
    );
    setListings(stores);
  };
  const debounceRegionChangeComplete = useCallback(debounce(handleRegionChangeComplete, 500), []);

  const handleMarkerPress = (listing: ListingRecord) => {
    setListing(listing);
  };

  const renderMarker = useCallback(
    (store) => (
      <Marker
        coordinate={{
          longitude: store.long,
          latitude: store.lat,
        }}
        key={store.id}
        onPress={() => handleMarkerPress(store)}>
        <View style={styles.marker}>
          <Ionicons name="library-outline" size={20} color={Colors.light} />
          {/*<Text style={styles.markerText}>{store.name}</Text>*/}
        </View>
      </Marker>
    ),
    []
  );

  return (
    <View style={defaultStyles.container}>
      {region && (
        <MapView
          ref={mapRef}
          animationEnabled={false}
          style={StyleSheet.absoluteFillObject}
          onRegionChangeComplete={debounceRegionChangeComplete}
          initialRegion={region}
          clusterColor="#fff"
          clusterTextColor="#000"
          clusterFontFamily="mon-sb"
          radius={40}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          showsMyLocationButton>
          {listings.map(renderMarker)}
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
  markerText: {
    fontSize: 10,
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
