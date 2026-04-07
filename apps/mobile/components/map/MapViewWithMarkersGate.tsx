import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import type { MapViewWithMarkersProps } from './MapViewWithMarkers';

/**
 * Defers loading @rnmapbox/maps until mount so expo-router can discover routes without native Mapbox.
 * Rebuild the dev client after native changes: pnpm prebuild && pnpm android
 */
export function MapViewWithMarkersGate(props: MapViewWithMarkersProps) {
  const [MapComp, setMapComp] = useState<React.ComponentType<MapViewWithMarkersProps> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    import('./MapViewWithMarkers')
      .then((m) => setMapComp(() => m.MapViewWithMarkers))
      .catch((err) => {
        console.warn('[MapViewWithMarkersGate]', err);
        setFailed(true);
      });
  }, []);

  if (failed) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          Kaart kan niet worden geladen. Bouw de app opnieuw met native modules:{' '}
          <Text style={styles.mono}>pnpm prebuild</Text> daarna{' '}
          <Text style={styles.mono}>pnpm android</Text>.
        </Text>
      </View>
    );
  }

  if (!MapComp) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <MapComp {...props} />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 13,
  },
});
