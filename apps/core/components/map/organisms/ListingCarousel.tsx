import { BottomSheet } from 'heroui-native/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DefaultCard from '~/components/map/molecules/DefaultCard';
import ListingCard from '~/components/map/molecules/ListingCard';
import { ListingRecord } from '~/lib/types/models';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  category: string;
  listing: ListingRecord | null;
  listings: ListingRecord[];
  setListing: (state: ListingRecord | null) => void;
  emptySubtleMessage?: string | null;
}

const ListingCarousel = ({
  category,
  listing,
  listings,
  setListing,
  emptySubtleMessage,
}: Props) => {
  const insets = useSafeAreaInsets();
  const carouselRef = useRef<ICarouselInstance>(null);
  const [isOpen, setIsOpen] = useState(true);
  const hasListings = listings.length > 0;
  const snapPoints = ['7%', '30%'];
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

  if (!hasListings) {
    return (
      <View style={[styles.emptyDock, { paddingBottom: Math.max(12, insets.bottom) }]}>
        <DefaultCard onPress={() => {}} subtleMessage={emptySubtleMessage} />
      </View>
    );
  }

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={setIsOpen}>
      <BottomSheet.Portal>
        <BottomSheet.Content
          enableDynamicSizing={false}
          snapPoints={snapPoints}
          enablePanDownToClose={false}
          backgroundClassName="bg-[#f4f4e8]">
          <View style={styles.container}>
            {/* Small count badge only - BottomSheet has its own drag handle */}
            {hasListings && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{listings.length}</Text>
              </View>
            )}
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
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
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
  emptyDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
});

export default ListingCarousel;
