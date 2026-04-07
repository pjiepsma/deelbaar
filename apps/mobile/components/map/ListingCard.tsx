import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import Colors from '~/constants/Colors';
import { CARD_WIDTH, CARD_HEIGHT, CARD_SPACING } from '~/lib/constants/listings';
import { ListingRecord } from '~/lib/types/models';
import { getCategoryDisplayName, getCategoryColor } from '~/lib/utils/categoryHelpers';
import { isListingOwner } from '~/lib/utils/listingHelpers';
import { calculateDistance, getFirstImageUrl } from '~/lib/utils/mapUtils';

const minibiebPlaceholder = require('~/assets/images/minibieb-placeholder.jpg');

interface ListingCardProps {
  listing: ListingRecord;
  isSelected: boolean;
  isFavorite: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  userId: string | null;
  onPress: () => void;
  onToggleFavorite: (listingId: string, currentlyFavorite: boolean) => void;
  onViewProducts: (listing: ListingRecord) => void;
  onManageProducts: (listing: ListingRecord) => void;
}

/**
 * Listing card component for the carousel
 * Displays listing image, title, category, distance, and action buttons
 */
export const ListingCard = React.memo<ListingCardProps>(
  ({
    listing,
    isSelected,
    isFavorite,
    userLocation,
    userId,
    onPress,
    onToggleFavorite,
    onViewProducts,
    onManageProducts,
  }) => {
    const categoryName = getCategoryDisplayName(listing.category);
    const categoryColor = getCategoryColor(listing.category);

    let distance: number | null = typeof listing.distance === 'number' ? listing.distance : null;
    if (!distance && userLocation && listing.location?.coordinates) {
      const [lon, lat] = listing.location.coordinates;
      distance = calculateDistance(userLocation.latitude, userLocation.longitude, lat, lon);
    }

    const imageUrl = getFirstImageUrl(listing);
    const listingOwner = isListingOwner(listing, userId);

    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            borderRadius: Colors.radius.xl,
            backgroundColor: Colors.background.secondary,
            overflow: 'hidden',
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? Colors.primary : Colors.border.light,
            flexDirection: 'row',
            marginRight: CARD_SPACING,
            opacity: pressed ? 0.95 : 1,
            ...Colors.shadowTokens.lg,
          },
        ]}>
        <XStack flex={1} height="100%">
          {/* Image Thumbnail on Left */}
          <YStack
            width={120}
            height={CARD_HEIGHT}
            flexShrink={0}
            padding={6}
            justifyContent="center"
            alignItems="center"
            position="relative">
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{
                  width: 108,
                  height: 120,
                  borderRadius: Colors.radius.lg,
                }}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={minibiebPlaceholder}
                style={{
                  width: 108,
                  height: 120,
                  borderRadius: Colors.radius.lg,
                }}
                resizeMode="cover"
              />
            )}
            <YStack
              position="absolute"
              top={10}
              left={10}
              zIndex={1}
              backgroundColor={categoryColor}
              borderRadius={Colors.radius.sm}
              paddingHorizontal={8}
              paddingVertical={4}>
              <Text
                fontSize={11}
                fontWeight="700"
                color="#fff"
                textTransform="uppercase"
                letterSpacing={0.5}>
                {categoryName}
              </Text>
            </YStack>
          </YStack>

          {/* Content on Right */}
          <YStack flex={1} padding={12} justifyContent="space-between" minWidth={0}>
            <XStack alignItems="center" justifyContent="flex-end" marginBottom={8}>
              <YStack flex={1} />
              {userId && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(listing.id, isFavorite);
                  }}
                  hitSlop={8}
                  style={{ padding: 4 }}>
                  <Ionicons
                    name={isFavorite ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isFavorite ? Colors.error : Colors.text.tertiary}
                  />
                </Pressable>
              )}
            </XStack>

            <Text
              numberOfLines={2}
              fontSize={15}
              fontWeight="600"
              color={Colors.text.primary}
              lineHeight={20}
              marginBottom={4}>
              {listing.name ?? 'Onbekende locatie'}
            </Text>

            <XStack alignItems="center" flexWrap="wrap" gap={4}>
              {distance !== null && (
                <>
                  <Ionicons name="location" size={14} color={Colors.text.secondary} />
                  <Text fontSize={13} color={Colors.text.secondary} lineHeight={18}>
                    {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
                  </Text>
                </>
              )}
              {distance !== null && listing.location?.address && (
                <Text fontSize={13} color={Colors.text.tertiary}>
                  {' '}
                  •{' '}
                </Text>
              )}
              {listing.location?.address && (
                <Text numberOfLines={1} fontSize={13} color={Colors.text.secondary} lineHeight={18}>
                  {listing.location.address.split(',')[0]}
                </Text>
              )}
            </XStack>

            {['food', 'hygiene', 'community'].includes(listing.category || '') && (
              <XStack gap={8} marginTop={8}>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onViewProducts(listing);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: Colors.radius.sm,
                    borderWidth: 1,
                    borderColor: Colors.primary,
                    gap: 4,
                  }}>
                  <Ionicons name="basket-outline" size={14} color={Colors.primary} />
                  <Text fontSize={11} fontWeight="600" color={Colors.primary}>
                    Aanbod bekijken
                  </Text>
                </Pressable>

                {listingOwner && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      onManageProducts(listing);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: Colors.radius.sm,
                      backgroundColor: Colors.primary,
                      gap: 4,
                    }}>
                    <Ionicons name="create-outline" size={14} color="#fff" />
                    <Text fontSize={11} fontWeight="600" color="#fff">
                      Beheren
                    </Text>
                  </Pressable>
                )}
              </XStack>
            )}
          </YStack>
        </XStack>
      </Pressable>
    );
  }
);
