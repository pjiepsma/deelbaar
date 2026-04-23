import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Mapbox, { Camera, MapView, PointAnnotation } from '@rnmapbox/maps';

import MarkerComponent from '~/components/map/atom/Marker';
import Loader from '~/components/shared/Loader';
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
  listings: ListingRecord[];
  setListings: (state: ListingRecord[]) => void;
  setListing: (state: ListingRecord | null) => void;
  listing: ListingRecord | null;
  searchScope: SearchScope;
  searchRadius: number;
  onMapCenterChange?: (center: { latitude: number; longitude: number }) => void;
}

const ListingsMapNew = ({
  listings,
  setListings,
  setListing,
  listing,
  searchScope,
  searchRadius,
  onMapCenterChange,
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
  const hasAppliedInitialGpsRef = useRef(false);

  const { data: location, isLoading: locationLoading } = useCurrentLocation();
  const {
    data: nearbyResponse,
    isFetching: nearbyFetching,
    isError: nearbyIsError,
    error: nearbyError,
    isSuccess: nearbyIsSuccess,
  } = useNearbyListings(location || null, {
    radius: searchRadius,
    enabled: !!location,
    scope: searchScope,
  });
  const nearbyListings = useMemo(() => nearbyResponse?.docs ?? [], [nearbyResponse?.docs]);

  useEffect(() => {
    if (!__DEV__) return;
    console.log('[ListingsMapNew]', {
      platform: Platform.OS,
      mapboxToken: Boolean(mapboxToken),
      locationLoading,
      hasLocation: Boolean(location),
      nearbyQuery: {
        fetching: nearbyFetching,
        success: nearbyIsSuccess,
        error: nearbyIsError,
        message: nearbyError instanceof Error ? nearbyError.message : nearbyError ? String(nearbyError) : null,
        docCount: nearbyListings.length,
      },
      propListingsForMarkers: listings.length,
    });
  }, [
    location,
    locationLoading,
    listings.length,
    nearbyError,
    nearbyFetching,
    nearbyIsError,
    nearbyIsSuccess,
    nearbyListings.length,
    mapboxToken,
  ]);

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
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      });
    }
  }, [location, setLocation]);

  /** First GPS fix — fly camera once (avoid controlled Camera props that reset every render). */
  useEffect(() => {
    if (!location || !cameraRef.current || hasAppliedInitialGpsRef.current) return;
    hasAppliedInitialGpsRef.current = true;
    cameraRef.current.setCamera({
      centerCoordinate: [location.longitude, location.latitude],
      zoomLevel: 12,
      animationDuration: 600,
    });
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

  const initialCenter: [number, number] = [region.longitude, region.latitude];
  const initialZoom = Math.log2(360 / Math.max(region.latitudeDelta, 0.001));

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        styleURL={mapStyleUrl}
        /** Android: GLSurfaceView draws above RN siblings; TextureView allows carousel / bottom sheet on top. */
        surfaceView={Platform.OS === 'android' ? false : undefined}
        scaleBarEnabled={false}
        compassEnabled={false}
        logoPosition={{ bottom: insets.bottom + 84, left: 8 }}
        attributionPosition={{ bottom: insets.bottom + 84, right: 8 }}
        onCameraChanged={(event: any) => {
          const centerCoord = event?.properties?.center as number[] | undefined;
          if (!centerCoord || centerCoord.length < 2 || !onMapCenterChange) return;
          onMapCenterChange({ latitude: centerCoord[1], longitude: centerCoord[0] });
        }}>
        <Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: initialCenter, zoomLevel: initialZoom }}
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
              anchor={{ x: 0.5, y: 1 }}
              onSelected={() => handleMarkerPress(item)}>
              <MarkerComponent
                store={item}
                selected={isSelected}
                onPress={() => handleMarkerPress(item)}
              />
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
