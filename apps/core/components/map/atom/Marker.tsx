// atoms/Marker.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppColors } from '~/lib/theme';

interface MarkerComponentProps {
  store: any; // ListingRecord or old format
  onPress: () => void;
  selected: boolean;
}

const MarkerComponent: React.FC<MarkerComponentProps> = memo(({ store, onPress, selected }) => {
  const colors = useAppColors();
  const latitude = store.lat ?? store.location?.coordinates?.[1];
  const longitude = store.long ?? store.location?.coordinates?.[0];

  if (!latitude || !longitude) {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel={typeof store.name === 'string' ? store.name : 'Listing'}>
      <View
        style={[
          styles.marker,
          {
            backgroundColor: selected ? colors.light : colors.primary,
            borderColor: selected ? colors.primary : colors.light,
            borderWidth: selected ? 3 : 2,
          },
        ]}>
        <Ionicons
          name={selected ? 'location' : 'library-outline'}
          size={selected ? 18 : 16}
          color={selected ? colors.primary : colors.light}
        />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  marker: {
    flexDirection: 'row',
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
});

export default MarkerComponent;
