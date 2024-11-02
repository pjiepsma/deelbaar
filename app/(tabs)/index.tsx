import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import ActionRow from '~/components/ActionRow';
import ListingCarousel from '~/components/map/organisms/ListingCarousel';
import ListingsMap from '~/components/map/organisms/ListingsMap';
import { ListingRecord } from '~/lib/powersync/AppSchema';
import { useSystem } from '~/lib/powersync/PowerSync';
import { SelectLatestImages } from '~/lib/powersync/Queries';
import { PictureEntry } from '~/lib/types/types';

const Index = () => {
  const [category, setCategory] = useState('Books');
  const [modalState, setModalState] = useState(false);
  const [listingModal, setListingModal] = useState(false);
  const { connector, powersync, attachmentQueue } = useSystem();

  const animatedPosition = useSharedValue(0);
  const [listing, setListing] = useState<ListingRecord | null>(null);

  const [listings, setListings] = useState<ListingRecord[]>([]); // Full listings
  const [listingsPictures, setListingsPictures] = useState<ListingRecord[]>([]); // Full listings

  const [filteredListings, setFilteredListings] = useState<ListingRecord[]>([]); // Filtered listings
  const [regionBounds, setRegionBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLong: number;
    maxLong: number;
  } | null>(null);

  useEffect(() => {
    const fetchPictures = async () => {
      await connector.fetchCredentials();

      if (listings.length > 0) {
        const listing_ids = listings.map((location) => location.id);
        // setLoading(true);
        try {
          const sql = SelectLatestImages(listing_ids);
          const pictures: PictureEntry[] = await powersync.getAll(sql, listing_ids);
          const locationsDataWithPictures = listings.map((location) => {
            const picture = pictures.find((pic) => pic.listing_id === location.id) || null; // Get the picture or null if not found
            return {
              ...location,
              picture,
            };
          });

          setListingsPictures(locationsDataWithPictures);
        } catch (err) {
          // setError(err);
        } finally {
          // setLoading(false);
        }
      }
    };

    fetchPictures();
  }, [listings, powersync]);

  // Whenever regionBounds change, filter listings
  useEffect(() => {
    if (!regionBounds || listings.length === 0) return;

    const { minLat, maxLat, minLong, maxLong } = regionBounds;
    const filtered = listingsPictures.filter(
      (store) =>
        store.lat >= minLat && store.lat <= maxLat && store.long >= minLong && store.long <= maxLong
    );
    setFilteredListings(filtered);
  }, [regionBounds, listingsPictures]);

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
