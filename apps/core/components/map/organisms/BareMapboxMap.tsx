import React, { useMemo } from 'react';
import { Platform, View } from 'react-native';
import Mapbox, { Camera, MapView } from '@rnmapbox/maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from 'heroui-native';
import { withUniwind } from 'uniwind';

import { mapStyleUrlForResolvedTheme } from '~/constants/Map';
import { useThemePreference } from '~/lib/providers/ThemePreferenceProvider';

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (mapboxToken) {
  Mapbox.setAccessToken(mapboxToken);
}

/** MapView + Uniwind so layout uses the same Tailwind pipeline as the rest of Core. */
const StyledMapView = withUniwind(MapView);

/** Default map center [lng, lat] — Netherlands. */
const DEFAULT_CENTER: [number, number] = [5.2913, 52.1326];

/**
 * Map-only shell: Mapbox `MapView` + `Camera`, no listings chrome.
 * UI: Uniwind `className`; HeroUI `Card` for config errors. Mapbox ornaments use numeric layout only.
 * Android: `surfaceView={false}` so future RN overlays can sit above the map.
 */
export default function BareMapboxMap() {
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useThemePreference();
  const styleURL = useMemo(() => mapStyleUrlForResolvedTheme(resolvedTheme), [resolvedTheme]);

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
        <Camera defaultSettings={{ centerCoordinate: DEFAULT_CENTER, zoomLevel: 11 }} />
        <Mapbox.UserLocation visible />
      </StyledMapView>
    </View>
  );
}
