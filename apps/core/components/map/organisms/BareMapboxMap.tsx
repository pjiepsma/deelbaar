import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Mapbox, { Camera, MapView, PointAnnotation } from '@rnmapbox/maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from 'heroui-native';
import { withUniwind } from 'uniwind';

import { mapStyleUrlForResolvedTheme } from '~/constants/Map';
import { useCurrentLocation, useNearbyListings } from '~/lib/hooks/useLocationQueries';
import { useThemePreference } from '~/lib/providers/ThemePreferenceProvider';

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (mapboxToken) {
  Mapbox.setAccessToken(mapboxToken);
}

const StyledMapView = withUniwind(MapView);
const MapPin = withUniwind(View);

const DEFAULT_MAP_CENTER_NL_LNGLAT: [number, number] = [5.2913, 52.1326];
const NEARBY_RADIUS_M = 50_000;

export default function BareMapboxMap() {
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useThemePreference();
  const styleURL = useMemo(() => mapStyleUrlForResolvedTheme(resolvedTheme), [resolvedTheme]);
  const cameraRef = useRef<any>(null);
  const centeredOnUser = useRef(false);

  const { data: location } = useCurrentLocation();
  const { data: nearby } = useNearbyListings(location ?? null, {
    radius: NEARBY_RADIUS_M,
    scope: 'city',
    enabled: !!location,
  });

  const listings = nearby?.docs ?? [];

  useEffect(() => {
    if (!location || !cameraRef.current || centeredOnUser.current) return;
    centeredOnUser.current = true;
    cameraRef.current.setCamera({
      centerCoordinate: [location.longitude, location.latitude],
      zoomLevel: 12,
      animationDuration: 600,
    });
  }, [location]);

  if (!mapboxToken) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Card variant="secondary" className="w-full max-w-md border border-border">
          <Card.Body className="gap-3">
            <Card.Title className="text-center text-lg">Mapbox token missing</Card.Title>
            <Card.Description className="text-center text-base leading-6">
              Add EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to apps/core/.env and reload the app.
            </Card.Description>
          </Card.Body>
        </Card>
      </View>
    );
  }

  const initialCenter: [number, number] = location
    ? [location.longitude, location.latitude]
    : DEFAULT_MAP_CENTER_NL_LNGLAT;
  const initialZoom = location ? 12 : 11;

  return (
    <View className="flex-1">
      <StyledMapView
        className="flex-1"
        styleURL={styleURL}
        surfaceView={Platform.OS === 'android' ? false : undefined}
        scaleBarEnabled={false}
        compassEnabled={false}
        logoPosition={{ bottom: insets.bottom + 16, left: 8 }}
        attributionPosition={{ bottom: insets.bottom + 16, right: 8 }}>
        <Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: initialCenter, zoomLevel: initialZoom }}
        />
        {listings.map((item) => {
          const coords = item.location?.coordinates;
          if (!coords || coords.length < 2) return null;
          const [lng, lat] = coords;
          return (
            <PointAnnotation
              key={String(item.id)}
              id={`listing-${item.id}`}
              coordinate={[lng, lat]}
              anchor={{ x: 0.5, y: 1 }}>
              <MapPin className="min-h-10 min-w-10 items-center justify-center rounded-full border-2 border-background bg-primary shadow-md">
                <Ionicons name="library-outline" size={16} color="#ffffff" />
              </MapPin>
            </PointAnnotation>
          );
        })}
      </StyledMapView>
    </View>
  );
}
