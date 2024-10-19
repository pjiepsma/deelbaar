import { ATTACHMENT_TABLE } from '@powersync/attachments';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import ActionRow from '~/components/ActionRow';
import HikeCarousel from '~/components/map/molecules/HikeCarousel';
import ListingsMap from '~/components/map/organisms/ListingsMap';
import { ListingRecord, PICTURE_TABLE } from '~/lib/powersync/AppSchema';
import { useSystem } from '~/lib/powersync/PowerSync';
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
          const sql = `
                        SELECT P.id AS picture_id,
                               P.*,
                               A.id AS attachment_id,
                               A.*
                        FROM ${PICTURE_TABLE} AS P
                                 LEFT JOIN ${ATTACHMENT_TABLE} AS A ON P.photo_id = A.id
                        WHERE P.id IN (SELECT P1.id
                                       FROM ${PICTURE_TABLE} AS P1
                                       WHERE P1.listing_id IN (${listing_ids.map(() => '?').join(',')})
                                         AND P1.created_at = (SELECT MAX(P2.created_at)
                                                              FROM ${PICTURE_TABLE} AS P2
                                                              WHERE P2.listing_id = P1.listing_id))
                        ORDER BY P.created_at DESC
                    `;

          const pictures: PictureEntry[] = await powersync.getAll(sql, listing_ids);

          // Map through listings and assign the single picture object
          const locationsDataWithPictures = listings.map((location) => {
            // Find the picture for the current location, assuming the SQL returns at most one picture per listing
            const picture = pictures.find((pic) => pic.listing_id === location.id) || null; // Get the picture or null if not found

            return {
              ...location,
              picture, // Assign the single picture object
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

  // useEffect(() => {
  //   setListingModal(true); TODO
  // }, [listing]);

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
      {/*<ListingsCarousel*/}
      {/*  listings={filteredListings}*/}
      {/*  // animatedPosition={animatedPosition}*/}
      {/*  // setListing={setListing}*/}
      {/*  onClose={() => {}}*/}
      {/*/>*/}
      <HikeCarousel listing={listing} listings={filteredListings} setListing={setListing} />
      {/* TODO Enable me */}
      {/*<ListingBottomSheet listing={listing} setListing={setListing} />*/}
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
