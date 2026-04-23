import { StyleSheet, View } from 'react-native';

import BareMapboxMap from '~/components/map/organisms/BareMapboxMap';

/**
 * Map tab — reset to Mapbox-only while the rest of the map UX is reworked.
 * Listings, search, filters, and dock were removed from this screen for now.
 */
export default function MapTabScreen() {
  return (
    <View style={styles.container}>
      <BareMapboxMap />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
