import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import ActionRow from '~/components/ActionRow';
import ListingCarousel from '~/components/map/organisms/ListingCarousel';
import ListingsMap from '~/components/map/organisms/ListingsMap';
import { ListingRecord } from '~/lib/powersync/AppSchema';

const Index = () => {
  const [category, setCategory] = useState('Books');
  const [filterState, setFilterState] = useState(false);
  const [listing, setListing] = useState<ListingRecord | null>(null);
  const [listings, setListings] = useState<ListingRecord[]>([]);
  const [regionBounds, setRegionBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLong: number;
    maxLong: number;
  } | null>(null);

  const filteredListings = useMemo(() => {
    if (!regionBounds || listings.length === 0) return [];

    const { minLat, maxLat, minLong, maxLong } = regionBounds;
    return listings.filter(
      (listing) =>
        listing.lat >= minLat &&
        listing.lat <= maxLat &&
        listing.long >= minLong &&
        listing.long <= maxLong
    );
  }, [regionBounds, listings]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="white" />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ActionRow
        onCategoryChanged={setCategory}
        setFilterState={setFilterState}
        listing={listing}
      />
      <ListingsMap
        setListings={setListings}
        listing={listing}
        listings={listings}
        setListing={setListing}
        setRegionBounds={setRegionBounds}
        category={category}
      />
      <ListingCarousel
        category={category}
        listing={listing}
        listings={filteredListings}
        setListing={setListing}
      />
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: '#fff',
  },
});
