import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import ActionRow from '~/components/ActionRow';
import ListingBottomSheet from '~/components/listing/ListingBottomSheet';
import HikeCarousel from '~/components/map/molecules/HikeCarousel';
import ListingsMap from '~/components/map/organisms/ListingsMap';
import { ListingRecord } from '~/lib/powersync/AppSchema';
import { useSystem } from '~/lib/powersync/PowerSync';

const Index = () => {
  const [category, setCategory] = useState('Books');
  const [modalState, setModalState] = useState(false);
  const [listingModal, setListingModal] = useState(false);
  const { connector, powersync, attachmentQueue } = useSystem();

  const animatedPosition = useSharedValue(0);
  const [listing, setListing] = useState<ListingRecord | null>(null);

  const [listings, setListings] = useState<ListingRecord[]>([]); // Full listings
  const [filteredListings, setFilteredListings] = useState<ListingRecord[]>([]); // Filtered listings
  const [regionBounds, setRegionBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLong: number;
    maxLong: number;
  } | null>(null);

  // Whenever regionBounds change, filter listings
  useEffect(() => {
    if (!regionBounds || listings.length === 0) return;

    const { minLat, maxLat, minLong, maxLong } = regionBounds;
    const filtered = listings.filter(
      (store) =>
        store.lat >= minLat && store.lat <= maxLat && store.long >= minLong && store.long <= maxLong
    );
    setFilteredListings(filtered);
  }, [regionBounds, listings]);

  useEffect(() => {
    setListingModal(true);
  }, [listing]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ActionRow
        onCategoryChanged={setCategory}
        setModalState={setModalState}
        animatedPosition={animatedPosition}
        listing={listing}
      />
      <ListingsMap
        setListings={setListings}
        listings={listings}
        setListing={setListing}
        setRegionBounds={setRegionBounds}
        category={category}
      />
      {/*<ListingsCarousel*/}
      {/*  listings={filteredListings}*/}
      {/*  // animatedPosition={animatedPosition}*/}
      {/*  // setListing={setListing}*/}
      {/*  onClose={() => {}}*/}
      {/*/>*/}
      <HikeCarousel listing={listing} listings={filteredListings} setListing={setListing} />
      <ListingBottomSheet listing={listing} setListing={setListing} />
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
    // paddingTop: 10,
    // paddingBottom: 10,
  },
});
