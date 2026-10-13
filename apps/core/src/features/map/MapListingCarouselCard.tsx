import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Chip, PressableFeedback, Skeleton, useThemeColor } from 'heroui-native';
import { Image, type GestureResponderEvent, View } from 'react-native';

import { useLocale } from '../../context/LocaleContext';
import { buildMapPlaceKindLabel } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import { mapPlaceCategoryColors } from '../../lib/mapPlaces/mapPlaceCategoryColors';
import {
  MAP_LISTING_CARD_BODY_HEIGHT,
  MAP_LISTING_CARD_HEIGHT,
  MAP_LISTING_HEART_SIZE,
  MAP_LISTING_IMAGE_HEIGHT,
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
  const categoryColors = card ? mapPlaceCategoryColors(card.mapPlaceCollection) : null;
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
        className="overflow-hidden p-0"
        style={{ width: cardWidth, height: MAP_LISTING_CARD_HEIGHT }}
      >
        <View className="relative w-full" style={{ height: MAP_LISTING_IMAGE_HEIGHT }}>
          <Skeleton
            isLoading={isLoading || !card?.imageUrl}
            className="h-full w-full"
            variant="pulse"
          >
            {card?.imageUrl ? (
              <Image
                source={{ uri: card.imageUrl }}
                className="h-full w-full"
                style={{ width: cardWidth, height: MAP_LISTING_IMAGE_HEIGHT }}
                resizeMode="cover"
              />
            ) : (
              <View className="h-full w-full bg-muted" style={{ height: MAP_LISTING_IMAGE_HEIGHT }} />
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

          {kindLabel && categoryColors ? (
            <View
              className="absolute max-w-full"
              style={{
                left: MAP_LISTING_THUMB_OVERLAY_INSET,
                bottom: MAP_LISTING_THUMB_OVERLAY_INSET,
                right: MAP_LISTING_HEART_SIZE + MAP_LISTING_THUMB_OVERLAY_INSET,
              }}
            >
              <Chip
                size="sm"
                variant="soft"
                className="max-w-full"
                style={{ backgroundColor: categoryColors.badgeBackground }}
              >
                <Chip.Label numberOfLines={1} style={{ color: categoryColors.badgeForeground }}>
                  {kindLabel}
                </Chip.Label>
              </Chip>
            </View>
          ) : isLoading ? (
            <View
              className="absolute"
              style={{
                left: MAP_LISTING_THUMB_OVERLAY_INSET,
                bottom: MAP_LISTING_THUMB_OVERLAY_INSET,
              }}
            >
              <Skeleton className="h-5 w-16 rounded-full" isLoading variant="pulse" />
            </View>
          ) : null}
        </View>

        <Card.Body
          className="justify-center gap-1 px-3 py-2.5"
          style={{ height: MAP_LISTING_CARD_BODY_HEIGHT }}
        >
          <Skeleton isLoading={isLoading || !card?.title} className="rounded-md" variant="pulse">
            {card?.title ? (
              <Card.Title className="text-base leading-5" numberOfLines={2}>
                {card.title}
              </Card.Title>
            ) : (
              <View />
            )}
          </Skeleton>

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

          {showDistance ? (
            <Card.Description className="text-xs" numberOfLines={1}>
              {t('map.distanceAway', { km: card.distanceKm!.toFixed(1) })}
            </Card.Description>
          ) : isLoading ? (
            <Skeleton className="h-3 w-24 rounded-md" isLoading variant="pulse" />
          ) : null}
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
