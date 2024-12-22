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
import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useAuth } from '~/lib/providers/AuthProvider';
import { useUser } from '~/lib/providers/UserProvider';

// Define types for location and address
interface Address {
  number: string;
  city: string;
  country: string;
  street: string;
  postalCode: string;
}

const AddPage = () => {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { location } = useUser();
  const router = useRouter();

  const navigation = useNavigation();

  // useEffect(() => {
  //   navigation.setOptions({ headerShown: false, title: 'Choose a location on the map' });
  // }, [navigation]);

  useEffect(() => {
    const fetchLocationAndAddress = async (coords) => {
      const { latitude, longitude } = coords;

      try {
        const region = {
          latitude,
          longitude,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        };
        setRegion(region);

        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode.length) {
          const { name, city, country, postalCode, street } = geocode[0];
          // setAddress({ number: name || '', city, country, postalCode, street });
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch location or address.');
      } finally {
        setLoading(false);
      }
    };
    if (location) {
      fetchLocationAndAddress(location.coords);
    }
  }, [location]);

  const onRegionChange = async (region: Region) => {
    try {
      const geoCode = await Location.reverseGeocodeAsync({
        latitude: region.latitude,
        longitude: region.longitude,
      });

      if (geoCode && geoCode.length > 0) {
        const { street, name, postalCode, city } = geoCode[0];
        setAddress(`${street} ${name}, ${postalCode}, ${city}`);
        setRegion(region);
      } else {
        setAddress('Address not found');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch address.');
    }
  };

  const handleConfirm = () => {
    router.back();
    if (region) {
      router.setParams({
        latitude: region.latitude,
        longitude: region.longitude,
        address: address,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/*<Stack.Screen*/}
      {/*  options={{*/}
      {/*    title: 'Choose a location on the map',*/}
      {/*    headerTitleAlign: 'center',*/}
      {/*    headerShown: true,*/}
      {/*    // headerRight: () => (*/}
      {/*    //   // TODO make the map buggy delta*/}
      {/*    //   <TouchableOpacity onPress={handleConfirm}>*/}
      {/*    //     <Text style={styles.okButton}>OK</Text>*/}
      {/*    //   </TouchableOpacity>*/}
      {/*    // ),*/}
      {/*  }}*/}
      {/*/>*/}
      {region && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={onRegionChange}></MapView>
      )}
      <View pointerEvents="none" style={styles.markerFixed}>
        <View pointerEvents="none" style={styles.markerFixed}>
          <Ionicons name="location" size={40} color="#DB4437" style={styles.icon} />
          <Ionicons name="location-outline" size={40} color="#A52723" style={styles.icon} />
        </View>
      </View>
      <View style={styles.addressContainer}>
        <Text style={styles.addressText}>{address}</Text>
      </View>
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
  okButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  markerFixed: {
    position: 'absolute',
    top: '50%',
    left: '50%',

    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    position: 'absolute',
  },
  addressContainer: {
    position: 'absolute',
    top: 30,
    alignSelf: 'center',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    elevation: 5,
  },
  addressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddPage;
