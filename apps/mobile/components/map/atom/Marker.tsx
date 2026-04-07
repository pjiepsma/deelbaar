// atoms/Marker.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import Colors from '~/constants/Colors';

interface MarkerComponentProps {
  store: any; // ListingRecord or old format
  onPress: () => void;
  selected: boolean;
}

const MarkerComponent: React.FC<MarkerComponentProps> = memo(({ store, onPress, selected }) => {
  const latitude = store.lat ?? store.location?.coordinates?.[1];
  const longitude = store.long ?? store.location?.coordinates?.[0];

  if (!latitude || !longitude) {
    return null;
  }

  return (
    <View style={[styles.marker, { backgroundColor: selected ? Colors.light : Colors.primary }]}>
      <Ionicons
        name="library-outline"
        size={10}
        color={selected ? Colors.primary : Colors.light}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  marker: {
    flexDirection: 'row',
    padding: 4,
    borderColor: Colors.primary,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: {
      width: 1,
      height: 10,
    },
  },
});

export default MarkerComponent;
