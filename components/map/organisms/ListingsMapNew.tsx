import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

import Loader from '~/components/Loader';
import Colors from '~/constants/Colors';
import { useNearbyListingsAuto } from '~/lib/hooks/useLocationQueries';
import { useAuth } from '~/lib/providers/AuthProvider';
import { useUser } from '~/lib/providers/UserProvider';
import { ListingRecord } from '~/lib/types/models';

interface Props {
  category: string;
  listings: ListingRecord[];
  setListings: (state: ListingRecord[]) => void;
  setListing: (state: ListingRecord | null) => void;
  listing: ListingRecord | null;
  setRegionBounds?: (bounds: any) => void;
}

const ListingsMap = ({
  category,
  listings,
  setListings,
  setListing,
  listing,
  setRegionBounds,
}: Props) => {
  const { setLocation } = useUser();
  const { user } = useAuth();
  const [region, setRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView>(null);

  // Use the auto-fetch nearby listings hook
  const { listings: nearbyListings, location, isLoading } = useNearbyListingsAuto(50000); // 50km

  useEffect(() => {
    if (nearbyListings && nearbyListings.length > 0) {
      setListings(nearbyListings);
    }
  }, [nearbyListings]);

  useEffect(() => {
    if (location) {
      setLocation(location);
      setRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });
    }
  }, [location]);

  const handleMarkerPress = (listingItem: ListingRecord) => {
    setListing(listingItem);

    // Center map on selected listing
    if (listingItem.location?.coordinates) {
      mapRef.current?.animateToRegion({
        latitude: listingItem.location.coordinates[1],
        longitude: listingItem.location.coordinates[0],
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    }
  };

  if (isLoading || !region) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
        showsCompass>
        {listings.map((item) => {
          if (!item.location?.coordinates) return null;

          const [longitude, latitude] = item.location.coordinates;

          return (
            <Marker
              key={item.id}
              coordinate={{ latitude, longitude }}
              title={item.name}
              description={item.description}
              pinColor={listing?.id === item.id ? Colors.primary : Colors.secondary}
              onPress={() => handleMarkerPress(item)}
            />
          );
        })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default ListingsMap;







