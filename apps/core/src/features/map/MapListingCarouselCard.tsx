import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Chip, PressableFeedback, Skeleton, useThemeColor } from 'heroui-native';
import { Image, type GestureResponderEvent, View } from 'react-native';

import { useLocale } from '../../context/LocaleContext';
import { buildMapPlaceKindLabel } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import {
  MAP_LISTING_CARD_HEIGHT,
  MAP_LISTING_CARD_INNER_GAP,
  MAP_LISTING_HEART_SIZE,
  MAP_LISTING_IMAGE_SIZE,
  MAP_LISTING_THUMB_OVERLAY_INSET,
} from './map.constants';
import { isMapListingCard, type MapListingCard, type MapListingCardPlaceholder } from './map.types';

type Props = {
  listing: MapListingCard | MapListingCardPlaceholder;
  cardWidth: number;
  isLoading: boolean;
  signedIn: boolean;
  onPress: () => void;
  onHeartPress: () => void;
};

export function MapListingCarouselCard({
  listing,
  cardWidth,
  isLoading,
  signedIn,
  onPress,
  onHeartPress,
}: Props) {
  const { t } = useLocale();
  const [foregroundColor, ratingColor] = useThemeColor(['foreground', 'warning']);

  const card = isMapListingCard(listing) ? listing : null;
  const kindLabel = card ? buildMapPlaceKindLabel(card, t) : null;
  const showRating = card?.rating !== undefined && card.reviews !== undefined;
  const showDistance = card?.distanceKm !== undefined;
  const canFavorite = !!card?.interaction?.canFavorite;
  const heartDisabled = signedIn && !canFavorite;
  const heartAccessibilityLabel = !signedIn
    ? t('map.favoriteSignInToSave')
    : card?.loved
      ? t('map.favoriteRemove')
      : t('map.favoriteAdd');

  const onHeartButtonPress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onHeartPress();
  };

  return (
    <PressableFeedback onPress={onPress} isDisabled={!card}>
      <Card
        className="flex-row items-center overflow-hidden p-2.5"
        style={{ width: cardWidth, height: MAP_LISTING_CARD_HEIGHT, gap: MAP_LISTING_CARD_INNER_GAP }}
      >
        <View className="relative" style={{ width: MAP_LISTING_IMAGE_SIZE, height: MAP_LISTING_IMAGE_SIZE }}>
          <Skeleton
            isLoading={isLoading || !card?.imageUrl}
            className="rounded-lg"
            style={{ width: MAP_LISTING_IMAGE_SIZE, height: MAP_LISTING_IMAGE_SIZE }}
            variant="pulse"
          >
            {card?.imageUrl ? (
              <Image
                source={{ uri: card.imageUrl }}
                className="rounded-lg"
                style={{ width: MAP_LISTING_IMAGE_SIZE, height: MAP_LISTING_IMAGE_SIZE }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="rounded-lg bg-muted"
                style={{ width: MAP_LISTING_IMAGE_SIZE, height: MAP_LISTING_IMAGE_SIZE }}
              />
            )}
          </Skeleton>

          {card ? (
            <View
              style={{
                position: 'absolute',
                top: MAP_LISTING_THUMB_OVERLAY_INSET,
                right: MAP_LISTING_THUMB_OVERLAY_INSET,
                width: MAP_LISTING_HEART_SIZE,
                height: MAP_LISTING_HEART_SIZE,
              }}
            >
              <Button
                size="sm"
                variant="secondary"
                isIconOnly
                isDisabled={heartDisabled}
                onPress={onHeartButtonPress}
                accessibilityLabel={heartAccessibilityLabel}
                className="size-8"
              >
                <Ionicons
                  name={card.loved ? 'heart' : 'heart-outline'}
                  size={16}
                  color={foregroundColor}
                />
              </Button>
            </View>
          ) : null}
        </View>

        <Card.Body className="min-w-0 flex-1 justify-center gap-0.5 px-0 py-0">
          {kindLabel ? (
            <View className="self-start">
              <Chip size="sm" variant="primary" className="max-w-full">
                <Chip.Label numberOfLines={1}>{kindLabel}</Chip.Label>
              </Chip>
            </View>
          ) : isLoading ? (
            <Skeleton className="h-5 w-20 rounded-full" isLoading variant="pulse" />
          ) : null}

          {showRating ? (
            <View className="flex-row items-center gap-1">
              <Ionicons name="star" size={14} color={ratingColor} />
              <Card.Description className="text-xs">
                {t('map.ratingReviews', {
                  rating: card.rating!.toFixed(1),
                  reviews: String(card.reviews),
                })}
              </Card.Description>
            </View>
          ) : isLoading ? (
            <Skeleton className="h-3.5 w-20 rounded-md" isLoading variant="pulse" />
          ) : null}

          <Skeleton isLoading={isLoading || !card?.title} className="rounded-md" variant="pulse">
            {card?.title ? (
              <Card.Title className="text-sm leading-[18px]" numberOfLines={2}>
                {card.title}
              </Card.Title>
            ) : (
              <View />
            )}
          </Skeleton>

          {showDistance ? (
            <Card.Description className="text-xs" numberOfLines={1}>
              {t('map.distanceAway', { km: card.distanceKm!.toFixed(1) })}
            </Card.Description>
          ) : isLoading ? (
            <Skeleton className="mt-0.5 h-3 w-24 rounded-md" isLoading variant="pulse" />
          ) : null}
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
