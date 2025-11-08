import BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';

import DefaultCard from '~/components/map/molecules/DefaultCard';
import ListingCard from '~/components/map/molecules/ListingCard';
import { ListingRecord } from '~/lib/types/models';
import { useToggleFavorite } from '~/lib/hooks/usePayloadQuery';
import { useAuth } from '~/lib/providers/AuthProvider';

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
  const { user } = useAuth();
  const router = useRouter();
  const baseOptions = {
    vertical: false,
    width: screenWidth * 0.9,
    height: 160, // Reduced from 260 to give more map space
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

  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ index, animated: true });
    }
  };

  const handleRemoveFavorite = async (listingId: string) => {
    // Favorites functionality - to be implemented with useToggleFavorite hook
    console.log('Remove favorite:', listingId);
  };

  const handleAddFavorite = async (listingId: string) => {
    // Favorites functionality - to be implemented with useToggleFavorite hook
    console.log('Add favorite:', listingId);
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
      enableDynamicSizing={false}
      ref={bottomSheetRef}
      snapPoints={SNAPPOINTS}
      backgroundStyle={{ backgroundColor: '#f4f4e8' }}>
      <View style={styles.container}>
        {/* Small count badge only - BottomSheet has its own drag handle */}
        {listings.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{listings.length}</Text>
          </View>
        )}
        {listings.length > 0 ? (
          <Carousel
            {...baseOptions}
            loop={false}
            ref={carouselRef}
            windowSize={2}
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
  countBadge: {
    position: 'absolute',
    top: 8,
    right: 16,
    backgroundColor: '#6B8E23',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    zIndex: 10,
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  carousel: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f4f4e8',
    justifyContent: 'center',
  },
});

export default ListingCarousel;
