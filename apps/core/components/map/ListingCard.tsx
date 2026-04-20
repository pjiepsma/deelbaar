import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { useAppColors } from '~/lib/theme';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  CARD_SPACING,
  LISTING_CARD_IMAGE_VERTICAL_INSET,
} from '~/lib/constants/listings';
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
    const colors = useAppColors();
    const categoryName = getCategoryDisplayName(listing.category);
    const categoryColor = getCategoryColor(listing.category);

    let distance: number | null = typeof listing.distance === 'number' ? listing.distance : null;
    if (!distance && userLocation && listing.location?.coordinates) {
      const [lon, lat] = listing.location.coordinates;
      distance = calculateDistance(userLocation.latitude, userLocation.longitude, lat, lon);
    }

    const imageUrl = getFirstImageUrl(listing);
    const listingOwner = isListingOwner(listing, userId);

    const thumbHeight = CARD_HEIGHT - LISTING_CARD_IMAGE_VERTICAL_INSET;
    const thumbWidth = Math.round(thumbHeight * 0.72);
    const imageColumnWidth = thumbWidth + 12;

    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            borderRadius: colors.radius.md,
            backgroundColor: colors.background.secondary,
            overflow: 'hidden',
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? colors.primary : colors.border.light,
            flexDirection: 'row',
            marginRight: CARD_SPACING,
            opacity: pressed ? 0.95 : 1,
            ...colors.shadowTokens.mapCard,
          },
        ]}>
        <View style={{ flex: 1, height: '100%', flexDirection: 'row' }}>
          <View
            style={{
              width: imageColumnWidth,
              height: CARD_HEIGHT,
              flexShrink: 0,
              padding: 6,
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
            }}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{
                  width: thumbWidth,
                  height: thumbHeight,
                  borderRadius: colors.radius.sm,
                }}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={minibiebPlaceholder}
                style={{
                  width: thumbWidth,
                  height: thumbHeight,
                  borderRadius: colors.radius.sm,
                }}
                resizeMode="cover"
              />
            )}
            <View
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 1,
                backgroundColor: categoryColor,
                borderRadius: colors.radius.sm,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                {categoryName}
              </Text>
            </View>
          </View>

          <View style={{ flex: 1, padding: 12, justifyContent: 'space-between', minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 8 }}>
              <View style={{ flex: 1 }} />
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
                    color={isFavorite ? colors.error : colors.text.tertiary}
                  />
                </Pressable>
              )}
            </View>

            <Text
              numberOfLines={2}
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: colors.text.primary,
                lineHeight: 20,
                marginBottom: 4,
              }}>
              {listing.name ?? 'Onbekende locatie'}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
              {distance !== null && (
                <>
                  <Ionicons name="location" size={14} color={colors.text.secondary} />
                  <Text style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 18 }}>
                    {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
                  </Text>
                </>
              )}
              {distance !== null && listing.location?.address && (
                <Text style={{ fontSize: 13, color: colors.text.tertiary }}>
                  {' '}
                  •{' '}
                </Text>
              )}
              {listing.location?.address && (
                <Text numberOfLines={1} style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 18 }}>
                  {listing.location.address.split(',')[0]}
                </Text>
              )}
            </View>

            {['food', 'hygiene', 'community', 'farm'].includes(listing.category || '') && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
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
                    borderRadius: colors.radius.sm,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    gap: 4,
                  }}>
                  <Ionicons name="basket-outline" size={14} color={colors.primary} />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>Aanbod bekijken</Text>
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
                      borderRadius: colors.radius.sm,
                      backgroundColor: colors.primary,
                      gap: 4,
                    }}>
                    <Ionicons name="create-outline" size={14} color="#fff" />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff' }}>Beheren</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  }
);
