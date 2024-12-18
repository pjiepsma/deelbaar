import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const LocationPage = () => {
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const params = useLocalSearchParams<{ latitude: string; longitude: string }>();
  const [region, setRegion] = useState<Region | null>(null);
  const [address, setAddress] = useState<string>('...');

  useEffect(() => {
    const fetchLocationAndAddress = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is needed.');
        return;
      }

      const region = {
        latitude: Number(params.latitude),
        longitude: Number(params.longitude),
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      };
      onRegionChange(region);
    };

    fetchLocationAndAddress();
  }, []);

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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Choose a location on the map',
          headerTitleAlign: 'center',
          headerShown: true,
          // headerRight: () => (
          //   // TODO make the map buggy delta
          //   <TouchableOpacity onPress={handleConfirm}>
          //     <Text style={styles.okButton}>OK</Text>
          //   </TouchableOpacity>
          // ),
        }}
      />
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
    color: '#333',
  },
  // container: {
  //   flex: 1,
  // },
  // okButton: {
  //   fontSize: 16,
  //   fontWeight: 'bold',
  //   color: '#007BFF',
  // },
  // map: {
  //   flex: 1,
  // },
  // markerFixed: {
  //   position: 'absolute',
  //   top: '50%',
  //   left: '50%',
  //   marginLeft: -15,
  //   marginTop: -30,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  // icon: {
  //   position: 'absolute',
  // },
  // addressContainer: {
  //   position: 'absolute',
  //   top: 30,
  //   alignSelf: 'center',
  //   backgroundColor: 'white',
  //   padding: 8,
  //   borderRadius: 8,
  //   elevation: 5,
  // },
  // addressText: {
  //   fontSize: 16,
  //   color: '#333',
  // },
});
export default LocationPage;
