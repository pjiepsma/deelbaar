import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, MapMarker } from 'react-native-maps';

import { getCategoryColor } from '~/lib/utils/categoryHelpers';

interface ClusterMarkerProps {
  latitude: number;
  longitude: number;
  pointCount: number;
  category: string | null;
}

/**
 * Cluster marker component for grouped map markers
 * Uses tracksViewChanges optimization with manual redraw() calls for performance
 */
export const ClusterMarker = ({
  latitude,
  longitude,
  pointCount,
  category,
}: ClusterMarkerProps) => {
  const markerRef = useRef<MapMarker>(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.redraw();
    }
  }, []);

  // Get category color, default to a neutral color if no category
  const categoryColor = category ? getCategoryColor(category) : '#8B5CF6';

  return (
    <Marker
      ref={markerRef}
      coordinate={{ latitude, longitude }}
      tracksViewChanges={false}>
      <View style={styles.marker}>
        <View style={[styles.clusterContainer, { backgroundColor: categoryColor }]}>
          <Text style={styles.clusterText}>{pointCount}</Text>
        </View>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterContainer: {
    borderRadius: 16,
    paddingHorizontal: 5,
    paddingVertical: 5,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  clusterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
