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
import { useRouter } from 'expo-router';

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
  const [loading, setLoading] = useState<boolean>(true);
  const mapRef = useRef<MapView>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchLocationAndAddress = async () => {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is needed.');
        setLoading(false);
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        };
        setRegion(newRegion);

        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode.length) {
          const { name, city, country, postalCode, street } = geocode[0];
          setAddress({ number: name || '', city, country, postalCode, street });
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch location or address.');
      } finally {
        setLoading(false);
      }
    };

    fetchLocationAndAddress();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.detailsContainer}>
        <View>
          <Text style={styles.subTitle}>Place details</Text>
          <Text>Provide some information about this place.</Text>
        </View>
      </View>

      {region && (
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/(modals)/listing/picker',
              params: { latitude: region.latitude, longitude: region.longitude },
            })
          }>
          <View pointerEvents="none">
            <MapView ref={mapRef} style={styles.map} initialRegion={region}>
              <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />
            </MapView>
          </View>
        </Pressable>
      )}

      <View style={styles.saveButtonContainer}>
        <Text style={styles.saveButton}>Save</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    height: 300,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
  },
  saveButtonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddPage;
