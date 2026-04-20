import React, { RefObject } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';

import { EmptyStateCard } from './EmptyStateCard';
import { ListingCard } from './ListingCard';

import { useAppColors } from '~/lib/theme';
import { CARD_TOTAL_WIDTH, CARD_WIDTH } from '~/lib/constants/listings';
import { ListingRecord } from '~/lib/types/models';

interface ListingCarouselProps {
  listings: ListingRecord[];
  selectedId: string | null;
  carouselRef: RefObject<FlatList<ListingRecord | { id: 'empty' }> | null>;
  isInitialLoading: boolean;
  hasActiveFilters: boolean;
  favoriteIds: Set<string>;
  userLocation: { latitude: number; longitude: number } | null;
  userId: string | null;
  onItemPress: (listing: ListingRecord) => void;
  onToggleFavorite: (listingId: string, currentlyFavorite: boolean) => void;
  onViewProducts: (listing: ListingRecord) => void;
  onManageProducts: (listing: ListingRecord) => void;
  onViewableItemsChanged: (info: { viewableItems: { item: any; index: number | null }[] }) => void;
  paddingBottom?: number;
}

/**
 * Horizontal carousel component displaying listing cards
 */
export const ListingCarousel = React.memo<ListingCarouselProps>(
  ({
    listings,
    selectedId,
    carouselRef,
    isInitialLoading,
    hasActiveFilters,
    favoriteIds,
    userLocation,
    userId,
    onItemPress,
    onToggleFavorite,
    onViewProducts,
    onManageProducts,
    onViewableItemsChanged,
    paddingBottom = 24,
  }) => {
    const colors = useAppColors();
    const data: (ListingRecord | { id: 'empty' })[] =
      listings.length === 0 ? [{ id: 'empty' as const }] : listings;

    return (
      <View style={[styles.bottomSheet, { paddingBottom }]}>
        {isInitialLoading && (
          <View style={[styles.loadingOverlay, { backgroundColor: `${colors.background.primary}B3` }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        <FlatList<ListingRecord | { id: 'empty' }>
          ref={carouselRef}
          horizontal
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) =>
            item.id === 'empty' ? (
              <EmptyStateCard hasActiveFilters={hasActiveFilters} />
            ) : (
              <ListingCard
                listing={item as ListingRecord}
                isSelected={selectedId === item.id}
                isFavorite={favoriteIds.has(item.id)}
                userLocation={userLocation}
                userId={userId}
                onPress={() => onItemPress(item as ListingRecord)}
                onToggleFavorite={onToggleFavorite}
                onViewProducts={onViewProducts}
                onManageProducts={onManageProducts}
              />
            )
          }
          contentContainerStyle={styles.cardList}
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_TOTAL_WIDTH}
          snapToAlignment="start"
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 50,
          }}
          removeClippedSubviews={false}
          windowSize={10}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={100}
          initialNumToRender={3}
          extraData={`${selectedId}-${Array.from(favoriteIds).sort().join(',')}`}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise((resolve) => setTimeout(resolve, 500));
            wait.then(() => {
              if (carouselRef.current && info.index !== undefined) {
                const currentData = listings.length === 0 ? [{ id: 'empty' }] : listings;
                if (info.index >= 0 && info.index < currentData.length) {
                  try {
                    carouselRef.current.scrollToIndex({
                      index: info.index,
                      animated: true,
                      viewPosition: 0.5,
                    });
                  } catch (error) {
                    console.warn('[ListingCarousel] Scroll retry failed:', error);
                  }
                }
              }
            });
          }}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  bottomSheet: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardList: {
    paddingLeft: (Dimensions.get('window').width - CARD_WIDTH) / 2,
    paddingRight: (Dimensions.get('window').width - CARD_WIDTH) / 2,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'flex-start',
  },
});
