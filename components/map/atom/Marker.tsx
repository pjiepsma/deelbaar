// atoms/Marker.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import Colors from '~/constants/Colors';

interface MarkerComponentProps {
  store: { lat: number; long: number; id: string };
  onPress: () => void;
  selected: boolean;
}

const MarkerComponent: React.FC<MarkerComponentProps> = memo(({ store, onPress, selected }) => {
  const [trackChanges, setTrackChanges] = useState(false); // Control tracksViewChanges

  useEffect(() => {
    setTrackChanges(true);

    const timeout = setTimeout(() => {
      setTrackChanges(false);
    }, 0);

    return () => clearTimeout(timeout);
  }, [selected]);

  return (
    <Marker
      coordinate={{ latitude: store.lat, longitude: store.long }}
      onPress={onPress}
      tracksViewChanges={trackChanges}>
      <View
        style={[styles.marker, { backgroundColor: selected ? Colors.secondary : Colors.primary }]}>
        <Ionicons name="library-outline" size={14} color={Colors.light} />
      </View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  marker: {
    flexDirection: 'row',
    padding: 4,
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
