import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Mapbox, { Camera, MapView, PointAnnotation } from '@rnmapbox/maps';

import Loader from '~/components/shared/Loader';
import Colors from '~/constants/Colors';
import { mapStyleUrlForResolvedTheme } from '~/constants/Map';
import { useThemePreference } from '~/lib/providers/ThemePreferenceProvider';
import { useCurrentLocation, useNearbyListings } from '~/lib/hooks/useLocationQueries';
import { useUser } from '~/lib/providers/UserProvider';
import { ListingRecord } from '~/lib/types/models';
import type { Region } from '~/lib/utils/mapUtils';
import type { SearchScope } from '~/lib/hooks/useSearchAccess';

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (mapboxToken) Mapbox.setAccessToken(mapboxToken);
const DEFAULT_REGION: Region = {
  latitude: 52.2392,
  longitude: 5.9802,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

interface Props {
  category: string;
  listings: ListingRecord[];
  setListings: (state: ListingRecord[]) => void;
  setListing: (state: ListingRecord | null) => void;
  listing: ListingRecord | null;
  searchScope: SearchScope;
  searchRadius: number;
  onMapCenterChange?: (center: { latitude: number; longitude: number }) => void;
  setRegionBounds?: (bounds: any) => void;
}

const ListingsMapNew = ({
  category,
  listings,
  setListings,
  setListing,
  listing,
  searchScope,
  searchRadius,
  onMapCenterChange,
  setRegionBounds,
}: Props) => {
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useThemePreference();
  const mapStyleUrl = useMemo(
    () => mapStyleUrlForResolvedTheme(resolvedTheme),
    [resolvedTheme],
  );
  const { setLocation } = useUser();
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const cameraRef = useRef<any>(null);

  const { data: location, isLoading: locationLoading } = useCurrentLocation();
  const { data: nearbyResponse } = useNearbyListings(location || null, {
    radius: searchRadius,
    enabled: !!location,
    scope: searchScope,
  });
  const nearbyListings = useMemo(() => nearbyResponse?.docs ?? [], [nearbyResponse?.docs]);

  useEffect(() => {
    setListings(nearbyListings ?? []);
  }, [nearbyListings, setListings]);

  useEffect(() => {
    if (location) {
      setLocation({
        coords: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: 0,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
      setRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });
    }
  }, [location, setLocation]);

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

  if (!mapboxToken) {
    return (
      <View style={styles.missingTokenContainer}>
        <Text style={styles.missingTokenTitle}>Mapbox token missing</Text>
        <Text style={styles.missingTokenBody}>
          Add EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to apps/core/.env and reload the app.
        </Text>
      </View>
    );
  }

  if (locationLoading && !location) {
    return <Loader delay={220} amount={3} visible />;
  }

  const center: [number, number] = [region.longitude, region.latitude];
  const zoom = Math.log2(360 / region.latitudeDelta);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        styleURL={mapStyleUrl}
        scaleBarEnabled={false}
        compassEnabled={false}
        logoPosition={{ bottom: insets.bottom + 84, left: 8 }}
        attributionPosition={{ bottom: insets.bottom + 84, right: 8 }}
        onCameraChanged={(event: any) => {
          const center = event?.properties?.center as number[] | undefined;
          if (!center || center.length < 2 || !onMapCenterChange) return;
          onMapCenterChange({ latitude: center[1], longitude: center[0] });
        }}>
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
  missingTokenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f8fafc',
  },
  missingTokenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  missingTokenBody: {
    fontSize: 14,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ListingsMapNew;
