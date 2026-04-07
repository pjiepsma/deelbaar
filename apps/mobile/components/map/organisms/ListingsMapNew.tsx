import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Mapbox, { Camera, MapView, PointAnnotation } from '@rnmapbox/maps';

import Loader from '~/components/Loader';
import Colors from '~/constants/Colors';
import { MAP_STYLE_URL } from '~/constants/Map';
import { useNearbyListingsAuto } from '~/lib/hooks/useLocationQueries';
import { useAuth } from '~/lib/providers/AuthProvider';
import { useUser } from '~/lib/providers/UserProvider';
import { ListingRecord } from '~/lib/types/models';
import type { Region } from '~/lib/utils/mapUtils';

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (mapboxToken) Mapbox.setAccessToken(mapboxToken);

interface Props {
  category: string;
  listings: ListingRecord[];
  setListings: (state: ListingRecord[]) => void;
  setListing: (state: ListingRecord | null) => void;
  listing: ListingRecord | null;
  setRegionBounds?: (bounds: any) => void;
}

const ListingsMapNew = ({
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
  const cameraRef = useRef<any>(null);

  const { listings: nearbyListings, location, isLoading } = useNearbyListingsAuto(50000);

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

    if (listingItem.location?.coordinates && cameraRef.current) {
      const [longitude, latitude] = listingItem.location.coordinates;
      cameraRef.current.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: 14,
        animationDuration: 300,
      });
    }
  };

  if (isLoading || !region || !mapboxToken) {
    return <Loader />;
  }

  const center: [number, number] = [region.longitude, region.latitude];
  const zoom = Math.log2(360 / region.latitudeDelta);

  return (
    <View style={styles.container}>
      <MapView style={styles.map} styleURL={MAP_STYLE_URL}>
        <Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: center, zoomLevel: zoom }}
          centerCoordinate={center}
          zoomLevel={zoom}
        />
        <Mapbox.UserLocation visible={true} />
        {listings.map((item) => {
          if (!item.location?.coordinates) return null;
          const [longitude, latitude] = item.location.coordinates;
          const isSelected = listing?.id === item.id;

          return (
            <PointAnnotation
              key={item.id}
              id={`marker-${item.id}`}
              coordinate={[longitude, latitude]}
              onSelected={() => handleMarkerPress(item)}>
              <View
                style={[
                  styles.marker,
                  { backgroundColor: isSelected ? Colors.primary : Colors.secondary },
                ]}>
                <Text style={styles.markerText} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            </PointAnnotation>
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
  marker: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 120,
  },
  markerText: {
    color: 'white',
    fontSize: 12,
  },
});

export default ListingsMapNew;
