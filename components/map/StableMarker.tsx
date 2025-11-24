import { FontAwesome5 } from '@expo/vector-icons';
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker, MapMarker } from 'react-native-maps';
import { ListingRecord } from '~/lib/types/models';
import { getCategoryIcon, getCategoryColor } from '~/lib/utils/categoryHelpers';

interface StableMarkerProps {
  listing: ListingRecord;
  onPress: () => void;
}

/**
 * Stable marker component to prevent blinking
 * Uses tracksViewChanges={false} for optimal performance
 */
export const StableMarker = ({ listing, onPress }: StableMarkerProps) => {
  const markerRef = useRef<MapMarker>(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.redraw();
    }
  }, []);

  const coords = listing.location?.coordinates;
  if (!coords || coords.length < 2) return null;

  const categoryIcon = getCategoryIcon(listing.category || '');
  const categoryColor = getCategoryColor(listing.category || '');
  const iconColor = categoryColor;

  return (
    <Marker
      ref={markerRef}
      coordinate={{ latitude: coords[1], longitude: coords[0] }}
      onPress={onPress}
      tracksViewChanges={false}>
      <View style={styles.markerCircle}>
        <FontAwesome5 name={categoryIcon as any} size={18} color={iconColor} solid />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
});