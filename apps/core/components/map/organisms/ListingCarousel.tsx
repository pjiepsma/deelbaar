import { BottomSheet, Button } from 'heroui-native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DefaultCard from '~/components/map/molecules/DefaultCard';
import ListingCard from '~/components/map/molecules/ListingCard';
import { CARD_HEIGHT, CARD_WIDTH } from '~/lib/constants/listings';
import type { ListingRecord } from '~/lib/types/models';

/** https://heroui.com/docs/native/components/bottom-sheet — compound tree + imports from `heroui-native`. */

const { width: screenWidth } = Dimensions.get('window');
const CAROUSEL_ITEM_WIDTH = Math.min(Math.round(CARD_WIDTH + 24), Math.round(screenWidth));
const CAROUSEL_ITEM_HEIGHT = Math.round(CARD_HEIGHT + 44);

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
  const snapPoints = ['28%', '46%'];
  const router = useRouter();

  const onSheetOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  useEffect(() => {
    if (hasListings) setIsOpen(true);
  }, [hasListings]);

  const baseOptions = {
    vertical: false as const,
    width: CAROUSEL_ITEM_WIDTH,
    height: CAROUSEL_ITEM_HEIGHT,
  };

  useEffect(() => {
    if (!listing) return;
    const index = listings.findIndex((hike) => hike.id === listing.id);
    if (index !== -1) {
      scrollToIndex(index);
    }
  }, [listing, listings]);

  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ index, animated: true });
    }
  };

  const handleRemoveFavorite = useCallback(async (listingId: string) => {
    console.log('Remove favorite:', listingId);
  }, []);

  const handleAddFavorite = useCallback(async (listingId: string) => {
    console.log('Add favorite:', listingId);
  }, []);

  const handleNavigate = useCallback(
    (item: ListingRecord) => {
      router.push(`/(modals)/listing/${item.id}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: ListingRecord }) => (
      <ListingCard
        item={item}
        category={category}
        selected={listing?.id === item.id}
        onSelect={() => setListing(item)}
        onOpenDetail={() => handleNavigate(item)}
        onAddFavorite={handleAddFavorite}
        onRemoveFavorite={handleRemoveFavorite}
      />
    ),
    [category, handleAddFavorite, handleNavigate, handleRemoveFavorite, listing?.id, setListing]
  );

  if (!hasListings) {
    return (
      <View style={[styles.emptyDock, { paddingBottom: Math.max(12, insets.bottom) }]}>
        <DefaultCard onPress={() => {}} subtleMessage={emptySubtleMessage} />
      </View>
    );
  }

  return (
    <View style={styles.sheetRoot} pointerEvents="box-none">
      <BottomSheet isOpen={isOpen} onOpenChange={onSheetOpenChange}>
        <View
          style={[styles.triggerDock, { paddingBottom: Math.max(8, insets.bottom) }]}
          pointerEvents="box-none">
          <BottomSheet.Trigger asChild>
            <Button variant="secondary" className="self-center">
              {`Minibiebs (${listings.length})`}
            </Button>
          </BottomSheet.Trigger>
        </View>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            bottomInset={insets.bottom}
            enableDynamicSizing={false}
            snapPoints={snapPoints}
            enablePanDownToClose={false}
            backgroundClassName="bg-[#f4f4e8]">
            <View style={[styles.container, { minHeight: CAROUSEL_ITEM_HEIGHT + 8 }]}>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{listings.length}</Text>
              </View>
              <Carousel
                {...baseOptions}
                loop={false}
                autoFillData={false}
                ref={carouselRef}
                windowSize={5}
                style={styles.carousel}
                data={listings}
                onSnapToItem={(index: number) => {
                  const picked = listings[index];
                  if (picked) setListing(picked);
                }}
                renderItem={renderItem}
              />
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetRoot: {
    flex: 1,
    width: '100%',
  },
  triggerDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    alignItems: 'center',
  },
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
    backgroundColor: '#f4f4e8',
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
