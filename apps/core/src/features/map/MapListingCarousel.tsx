import { Card } from 'heroui-native';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { FlatList, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tabBarOverlayClearance } from '../../navigation/tabBarClearance';
import {
  MAP_LISTING_CARD_GAP,
  MAP_LISTING_CARD_HEIGHT,
  MAP_OVERLAY_HORIZONTAL_PADDING,
  mapListingCarouselBottom,
  mapListingCarouselCardWidth,
} from './map.constants';
import { MapListingCarouselCard } from './MapListingCarouselCard';
import { listingMarkerKey } from './mapViewport';
import { isMapListingCard, type MapListingCard, type MapListingCardPlaceholder } from './map.types';

type Props = {
  listings: Array<MapListingCard | MapListingCardPlaceholder>;
  focusedListingKey: string | null;
  filterKey: string;
  isFetching: boolean;
  fetchError: string | null;
  fetchErrorTitle: string;
  fetchErrorDescription: string;
  emptyTitle: string;
  emptyDescription: string;
  signedIn: boolean;
  onPressCard: (card: MapListingCard) => void;
  onHeartPress: (card: MapListingCard) => void;
  onFocusedListingChange: (card: MapListingCard | null) => void;
  onCarouselSnap: (card: MapListingCard) => void;
};

export function MapListingCarousel({
  listings,
  focusedListingKey,
  filterKey,
  isFetching,
  fetchError,
  fetchErrorTitle,
  fetchErrorDescription,
  emptyTitle,
  emptyDescription,
  signedIn,
  onPressCard,
  onHeartPress,
  onFocusedListingChange,
  onCarouselSnap,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const carouselBottom = mapListingCarouselBottom(tabBarOverlayClearance(insets.bottom));
  const cardWidth = mapListingCarouselCardWidth(screenWidth);
  const snapInterval = cardWidth + MAP_LISTING_CARD_GAP;
  const listRef = useRef<FlatList<MapListingCard | MapListingCardPlaceholder>>(null);
  const prevFilterKeyRef = useRef(filterKey);

  const listingIdentityKey = useMemo(() => {
    return listings
      .filter(isMapListingCard)
      .map((item) => `${item.mapPlaceCollection}-${String(item.id)}`)
      .join('|');
  }, [listings]);

  useEffect(() => {
    const filterChanged = prevFilterKeyRef.current !== filterKey;
    prevFilterKeyRef.current = filterKey;

    const cards = listings.filter(isMapListingCard);
    if (cards.length === 0) {
      if (focusedListingKey) {
        onFocusedListingChange(null);
      }
      return;
    }

    let targetIndex = 0;
    if (!filterChanged && focusedListingKey) {
      const pinnedIndex = listings.findIndex(
        (item) => isMapListingCard(item) && listingMarkerKey(item) === focusedListingKey,
      );
      if (pinnedIndex >= 0) {
        targetIndex = pinnedIndex;
      }
    }

    listRef.current?.scrollToOffset({ offset: targetIndex * snapInterval, animated: false });

    const item = listings[targetIndex];
    const nextKey = isMapListingCard(item) ? listingMarkerKey(item) : null;
    if (nextKey !== focusedListingKey) {
      onFocusedListingChange(isMapListingCard(item) ? item : null);
    }
  }, [filterKey, focusedListingKey, listingIdentityKey, listings, onFocusedListingChange, snapInterval]);

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
      const item = listings[index];
      if (!isMapListingCard(item)) {
        onFocusedListingChange(null);
        return;
      }
      onFocusedListingChange(item);
      onCarouselSnap(item);
    },
    [listings, onCarouselSnap, onFocusedListingChange, snapInterval],
  );

  const hasListingCards = listings.some(isMapListingCard);
  const showEmptyState = !isFetching && !fetchError && !hasListingCards;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: carouselBottom,
      }}
    >
      {fetchError ? (
        <View style={{ paddingHorizontal: MAP_OVERLAY_HORIZONTAL_PADDING, marginBottom: MAP_LISTING_CARD_GAP }}>
          <Card>
            <Card.Body>
              <Card.Title>{fetchErrorTitle}</Card.Title>
              <Card.Description>{fetchErrorDescription}</Card.Description>
            </Card.Body>
          </Card>
        </View>
      ) : null}

      {showEmptyState ? (
        <View style={{ paddingHorizontal: MAP_OVERLAY_HORIZONTAL_PADDING }}>
          <Card>
            <Card.Body>
              <Card.Title>{emptyTitle}</Card.Title>
              <Card.Description>{emptyDescription}</Card.Description>
            </Card.Body>
          </Card>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          horizontal
          style={{ height: MAP_LISTING_CARD_HEIGHT }}
          data={listings}
          keyExtractor={(item, index) => {
            if (isMapListingCard(item) && item.id != null) {
              return `${item.mapPlaceCollection}-${String(item.id)}`;
            }
            return `placeholder-${index}`;
          }}
          renderItem={({ item }) => (
            <View style={{ height: MAP_LISTING_CARD_HEIGHT }}>
              <MapListingCarouselCard
                listing={item}
                cardWidth={cardWidth}
                isLoading={isFetching && !isMapListingCard(item)}
                signedIn={signedIn}
                onPress={() => {
                  if (isMapListingCard(item)) {
                    onPressCard(item);
                  }
                }}
                onHeartPress={() => {
                  if (isMapListingCard(item)) {
                    onHeartPress(item);
                  }
                }}
              />
            </View>
          )}
          snapToInterval={snapInterval}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ width: MAP_LISTING_CARD_GAP }} />}
          contentContainerStyle={{
            paddingHorizontal: MAP_OVERLAY_HORIZONTAL_PADDING,
          }}
          getItemLayout={(_, index) => ({
            length: snapInterval,
            offset: snapInterval * index,
            index,
          })}
          onMomentumScrollEnd={onMomentumScrollEnd}
        />
      )}
    </View>
  );
}
