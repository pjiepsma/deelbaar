import BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';

import DefaultCard from '~/components/map/molecules/DefaultCard';
import ListingCard from '~/components/map/molecules/ListingCard';
import { useAuth } from '~/lib/AuthProvider';
import { ListingRecord } from '~/lib/powersync/AppSchema';
import { useSystem } from '~/lib/powersync/PowerSync';
import { StatusBar } from 'expo-status-bar';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  category: string;
  listing: ListingRecord | null;
  listings: ListingRecord[];
  setListing: (state: ListingRecord | null) => void;
}

const ListingCarousel = ({ category, listing, listings, setListing }: Props) => {
  const carouselRef = useRef<ICarouselInstance>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const SNAPPOINTS = ['7%', '30%'];
  const { powersync } = useSystem();
  const { user } = useAuth();
  const router = useRouter();
  const baseOptions = {
    vertical: false,
    width: screenWidth * 0.9,
    height: 260,
  };

  useEffect(() => {
    if (listing) {
      const index = listings.findIndex((hike) => hike.id === listing.id);
      if (index !== -1) {
        scrollToIndex(index);
      }
      bottomSheetRef.current?.expand();
    }
  }, [listing]);

  useEffect(() => {
    if (listings) {
      scrollToIndex(0);
    }
  }, [listings]);

  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ index, animated: true });
    }
  };

  const removeFavorite = async (userId: string, listingId: string) => {
    const result = await powersync.execute('RemoveFavorite', [userId, listingId]);
    return result;
  };

  const handleRemoveFavorite = async (listingId: string) => {
    if (user?.id) {
      await removeFavorite(user.id, listingId);
    }
  };

  const addFavorite = async (userId: string, listingId: string) => {
    return await powersync.execute('AddFavorite', [userId, listingId]);
  };

  const handleAddFavorite = async (listingId: string) => {
    if (user?.id) {
      await addFavorite(user.id, listingId);
    }
  };

  const handleNavigate = (item) => {
    router.push({
      pathname: '/(modals)/listing/[id]', // Adjust this to your actual detail page path
      params: {
        id: item.id,
        dist_meters: item.dist_meters,
        lat: item.lat,
        long: item.long,
      },
    });
  };

  const renderItem = useCallback(
    ({ item }) => (
      <ListingCard
        item={item}
        category={category}
        onPress={() => handleNavigate(item)}
        onAddFavorite={handleAddFavorite}
        onRemoveFavorite={handleRemoveFavorite}
      />
    ),
    [category, handleAddFavorite, handleNavigate, handleRemoveFavorite]
  );

  return (
    <BottomSheet
      enableDynamicSizing={false} // todo
      ref={bottomSheetRef}
      snapPoints={SNAPPOINTS}
      backgroundStyle={{ backgroundColor: '#f4f4e8' }}>
      <StatusBar hidden />
      <View style={styles.container}>
        <View style={styles.handleContainer}>
          <Text style={styles.handleText}>
            {listings.length > 0 ? `${listings.length} Minibiebs` : 'Geen resultaten'}
          </Text>
        </View>
        {listings.length > 0 ? (
          <Carousel
            key={listings.length}
            {...baseOptions}
            loop={false}
            ref={carouselRef}
            style={styles.carousel}
            data={listings}
            onSnapToItem={(index: number) => setListing(listings[index])}
            renderItem={renderItem}
          />
        ) : (
          <DefaultCard onPress={() => {}} />
        )}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  handleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f4e8',
    paddingBottom: 10,
  },
  handleText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  carousel: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f4f4e8',
    justifyContent: 'center',
  },
});

export default ListingCarousel;
