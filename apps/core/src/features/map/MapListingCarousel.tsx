import { Card } from 'heroui-native';
import { FlatList, useWindowDimensions, View } from 'react-native';

import {
  MAP_LISTING_CARD_GAP,
  MAP_LISTING_CARD_HEIGHT,
  MAP_LISTING_CAROUSEL_BOTTOM_PADDING,
  MAP_OVERLAY_HORIZONTAL_PADDING,
  mapListingCarouselCardWidth,
} from './map.constants';
import { MapListingCarouselCard } from './MapListingCarouselCard';
import { isMapListingCard, type MapListingCard, type MapListingCardPlaceholder } from './map.types';

type Props = {
  listings: Array<MapListingCard | MapListingCardPlaceholder>;
  isFetching: boolean;
  fetchError: string | null;
  fetchErrorTitle: string;
  fetchErrorDescription: string;
  signedIn: boolean;
  onPressCard: (card: MapListingCard) => void;
  onHeartPress: (card: MapListingCard) => void;
};

export function MapListingCarousel({
  listings,
  isFetching,
  fetchError,
  fetchErrorTitle,
  fetchErrorDescription,
  signedIn,
  onPressCard,
  onHeartPress,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = mapListingCarouselCardWidth(screenWidth);
  const snapInterval = cardWidth + MAP_LISTING_CARD_GAP;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: MAP_LISTING_CAROUSEL_BOTTOM_PADDING,
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

      <FlatList
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
      />
    </View>
  );
}
