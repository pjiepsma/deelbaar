import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import ActionRow from '~/components/ActionRow';
import ListingBottomSheet from '~/components/listing/ListingBottomSheet';
import ListingsBottomSheet from '~/components/listing/ListingsBottomSheet';
import ListingsMap from '~/components/map/organisms/ListingsMap';
import { ListingRecord } from '~/lib/powersync/AppSchema';

const Index = () => {
  const [category, setCategory] = useState('Books');
  const [modalState, setModalState] = useState(false);
  const [listingModal, setListingModal] = useState(false);

  const animatedPosition = useSharedValue(0);
  const [listings, setListings] = useState<ListingRecord[]>([]);
  const [listing, setListing] = useState<ListingRecord | null>(null);

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
        category={category}
        setListings={setListings}
        listings={listings}
        setListing={setListing}
      />
      <ListingsBottomSheet
        listings={listings}
        category={category}
        animatedPosition={animatedPosition}
        setListing={setListing}
      />
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
