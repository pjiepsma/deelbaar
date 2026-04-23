import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Map tab stacking: map (flex) → floating controls → full-screen dock layer on top.
 * See apps/core/docs/map-tab.md (Android surfaceView, nearby query, debug strip).
 */

/** Flip to `false` when you no longer need the yellow strip in dev. */
const MAP_TAB_DEBUG_DOCK = __DEV__ && true;

type MapTabShellProps = {
  map: ReactNode;
  /** Search bar, filters — absolute top; use pointerEvents="box-none" on wrapper if needed */
  controls: ReactNode;
  /** ListingCarousel / bottom UI — must stay above native map on Android */
  dock: ReactNode;
  /** From `useSafeAreaInsets().top` — keeps controls below status bar */
  controlsTopInset: number;
  /** Shown on yellow strip when `MAP_TAB_DEBUG_DOCK` is true, e.g. `L12 F12` */
  debugDockMeta?: string;
};

export function MapTabShell({ map, controls, dock, controlsTopInset, debugDockMeta }: MapTabShellProps) {
  return (
    <View style={styles.root}>
      {map}
      <View style={[styles.controlsLayer, { top: controlsTopInset + 10 }]} pointerEvents="box-none">
        {controls}
      </View>
      <View style={styles.dockLayer} pointerEvents="box-none">
        {dock}
        {MAP_TAB_DEBUG_DOCK ? (
          <View style={styles.debugDockStrip} pointerEvents="none">
            <Text style={styles.debugDockText}>
              {debugDockMeta?.trim() ? debugDockMeta : 'map-tab dock (set debugDockMeta)'}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  controlsLayer: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 0,
    zIndex: 35,
  },
  /** Same stacking contract as before: RN above Mapbox on Android when map uses texture view. */
  dockLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 50,
    justifyContent: 'flex-end',
  },
  debugDockStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    elevation: 60,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 235, 59, 0.92)',
    borderTopWidth: 4,
    borderTopColor: '#ff00ff',
  },
  debugDockText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
  },
});
