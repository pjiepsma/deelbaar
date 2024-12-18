import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router';

// Define types for location and address
interface Address {
  number: string;
  city: string;
  country: string;
  street: string;
  postalCode: string;
}

const AddPage = () => {
  const [region, setRegion] = useState<Region | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const params = useGlobalSearchParams<{ latitude: string; longitude: string }>();

  // useEffect(() => {
  //   if (params) {
  //     const { latitude, longitude } = params;
  //     const reg = {
  //       latitude: Number(latitude),
  //       longitude: Number(longitude),
  //       latitudeDelta: 0.003,
  //       longitudeDelta: 0.003,
  //     };
  //     console.log('get old Region', reg);
  //
  //     // setRegion(reg);
  //   }
  // }, []);

  useEffect(() => {
    const fetchLocationAndAddress = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is needed.');
        return;
      }

      const newRegion = {
        latitude: Number(params.latitude),
        longitude: Number(params.longitude),
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      };
      setRegion(newRegion);
    };

    fetchLocationAndAddress();
  }, []);

  return (
    <View style={styles.container}>
      {region && (
        <MapView ref={mapRef} style={styles.map} initialRegion={region}>
          <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />
        </MapView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    height: '100%',
    width: '100%',
  },
});

export default AddPage;
