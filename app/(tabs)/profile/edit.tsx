import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Pressable } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '~/lib/providers/UserProvider';

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
  const params = useLocalSearchParams();
  const { location } = useUser();

  useEffect(() => {
    // console.log(params);
  }, [params]);

  useEffect(() => {
    const fetchLocationAndAddress = async () => {
      if (!location) {
        return;
      }
      try {
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

    if (params) {
      // setRegion({
      //   latitude: Number(params.latitude),
      //   longitude: Number(params.longitude),
      //   latitudeDelta: 0.003,
      //   longitudeDelta: 0.003,
      // });
    }
    //   setAddress(params.address);
    //   setLoading(false);
    // } else {
    fetchLocationAndAddress();
    // }
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
              pathname: '/(tabs)/profile/picker',
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
