import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import ActionRow from '~/components/ActionRow';
import ListingCarousel from '~/components/map/organisms/ListingCarousel';
import ListingsMap from '~/components/map/organisms/ListingsMap';
import { ListingRecord } from '~/lib/powersync/AppSchema';
import { useSystem } from '~/lib/powersync/PowerSync';
import { SelectLatestImages } from '~/lib/powersync/Queries';
import { PictureEntry } from '~/lib/types/types';

const Index = () => {
  const { connector, powersync } = useSystem();

  const [category, setCategory] = useState('Books');
  const [filterState, setFilterState] = useState(false);
  const [listing, setListing] = useState<ListingRecord | null>(null);
  const [listings, setListings] = useState<ListingRecord[]>([]);
  const [listingsPictures, setListingsPictures] = useState<ListingRecord[]>([]);
  const [regionBounds, setRegionBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLong: number;
    maxLong: number;
  } | null>(null);

  const fetchPictures = useCallback(async () => {
    await connector.fetchCredentials();

    if (listings.length > 0) {
      const listing_ids = listings.map((location) => location.id);
      try {
        const sql = SelectLatestImages(listing_ids);
        const pictures: PictureEntry[] = await powersync.getAll(sql, listing_ids);
        const locationsDataWithPictures = listings.map((location) => {
          const picture = pictures.find((pic) => pic.listing_id === location.id) || null;
          return {
            ...location,
            picture,
          };
        });

        setListingsPictures(locationsDataWithPictures);
      } catch (err) {
        console.error(err);
      }
    }
  }, [listings, connector, powersync]);

  useEffect(() => {
    fetchPictures();
  }, [fetchPictures]);

  const filteredListings = useMemo(() => {
    if (!regionBounds || listings.length === 0) return [];

    const { minLat, maxLat, minLong, maxLong } = regionBounds;
    return listingsPictures.filter(
      (store) =>
        store.lat >= minLat && store.lat <= maxLat && store.long >= minLong && store.long <= maxLong
    );
  }, [regionBounds, listingsPictures]);

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
