import { useCallback, useState, useRef, useEffect } from 'react';
import { FlatList } from 'react-native';

import { ListingRecord } from '../types/models';

interface UseListingsCarouselOptions {
  visibleListings: ListingRecord[];
  onViewableItemsChanged?: (items: { item: ListingRecord; index: number | null }[]) => void;
  onItemSelect?: (item: ListingRecord, index: number) => void;
}

/**
 * Hook to manage listings carousel state and interactions
 * Handles carousel ref, viewable items tracking, and scrolling
 */
export function useListingsCarousel(options?: UseListingsCarouselOptions) {
  const { visibleListings, onViewableItemsChanged, onItemSelect } = options || {};

  const carouselRef = useRef<FlatList<ListingRecord | { id: 'empty' }> | null>(null);
  const [viewableItemIndex, setViewableItemIndex] = useState<number>(0);

  // Store visibleListings in a ref to access latest value in callbacks
  const visibleListingsRef = useRef(visibleListings);
  useEffect(() => {
    visibleListingsRef.current = visibleListings;
  }, [visibleListings]);

  // Handle viewable items changed
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: { item: any; index: number | null }[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].item.id !== 'empty') {
        const item = viewableItems[0].item as ListingRecord;
        const index = viewableItems[0].index || 0;

        if (index !== viewableItemIndex) {
          setViewableItemIndex(index);
          if (onItemSelect) {
            onItemSelect(item, index);
          }
        }
      }

      if (onViewableItemsChanged) {
        onViewableItemsChanged(
          viewableItems.map((vi) => ({
            item: vi.item as ListingRecord,
            index: vi.index,
          }))
        );
      }
    },
    [viewableItemIndex, onViewableItemsChanged, onItemSelect]
  );

  // Scroll to listing
  const scrollToListing = useCallback((listing: ListingRecord) => {
    // Small delay to ensure FlatList is ready and check latest data
    setTimeout(() => {
      const currentVisible = visibleListingsRef.current;
      if (carouselRef.current && currentVisible && currentVisible.length > 0) {
        const index = currentVisible.findIndex((l) => l.id === listing.id);
        // Only scroll if listing is actually in visibleListings and index is valid
        if (index !== -1 && index < currentVisible.length) {
          try {
            carouselRef.current.scrollToIndex({
              index,
              animated: true,
              viewPosition: 0.5, // Center the item
            });
          } catch (error) {
            // Silently fail if scroll fails (list might have changed)
            console.warn('[useListingsCarousel] Failed to scroll to listing:', error);
          }
        }
      }
    }, 150);
  }, []);

  return {
    carouselRef,
    viewableItemIndex,
    setViewableItemIndex,
    handleViewableItemsChanged,
    scrollToListing,
  };
}
