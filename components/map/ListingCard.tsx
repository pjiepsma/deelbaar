import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';

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

    // Calculate distance from user location
    let distance: number | null = typeof listing.distance === 'number' ? listing.distance : null;
    if (!distance && userLocation && listing.location?.coordinates) {
      const [lon, lat] = listing.location.coordinates;
      distance = calculateDistance(userLocation.latitude, userLocation.longitude, lat, lon);
    }

    const imageUrl = getFirstImageUrl(listing);
    const listingOwner = isListingOwner(listing, userId);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.card, isSelected && styles.cardActive]}
        onPress={onPress}>
        {/* Image Thumbnail on Left */}
        <View style={styles.cardImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <Image source={minibiebPlaceholder} style={styles.cardImage} resizeMode="cover" />
          )}
          {/* Category Badge at Top Left */}
          <View style={styles.cardImageBadge}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
              <Text style={styles.categoryBadgeText}>{categoryName}</Text>
            </View>
          </View>
        </View>

        {/* Content on Right */}
        <View style={styles.cardContentRight}>
          {/* Favorite Button Row */}
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={styles.cardFavoriteButton}
              onPress={(e) => {
                e.stopPropagation();
                onToggleFavorite(listing.id, isFavorite);
              }}
              activeOpacity={0.7}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite ? Colors.error : '#9ca3af'}
              />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text numberOfLines={2} style={styles.cardTitle}>
            {listing.name ?? 'Onbekende locatie'}
          </Text>

          {/* Details Row - Komoot style */}
          <View style={styles.cardDetailsRow}>
            {distance !== null && (
              <>
                <Ionicons name="location" size={14} color="#6b7280" />
                <Text style={styles.cardDetailText}>
                  {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
                </Text>
              </>
            )}
            {distance !== null && listing.location?.address && (
              <Text style={styles.cardDetailSeparator}> • </Text>
            )}
            {listing.location?.address && (
              <Text numberOfLines={1} style={styles.cardDetailText}>
                {listing.location.address.split(',')[0]}
              </Text>
            )}
          </View>

          {/* Product offerings voor relevante categorieën */}
          {['food', 'hygiene', 'community'].includes(listing.category || '') && (
            <View style={styles.productActions}>
              <TouchableOpacity
                style={styles.productButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onViewProducts(listing);
                }}>
                <Ionicons name="basket-outline" size={14} color={Colors.primary} />
                <Text style={styles.productButtonText}>Aanbod bekijken</Text>
              </TouchableOpacity>

              {listingOwner && (
                <TouchableOpacity
                  style={[styles.productButton, styles.manageButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    onManageProducts(listing);
                  }}>
                  <Ionicons name="create-outline" size={14} color="#fff" />
                  <Text style={styles.manageButtonText}>Beheren</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    marginRight: CARD_SPACING,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardImageContainer: {
    width: 120,
    height: CARD_HEIGHT,
    position: 'relative',
    flexShrink: 0,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: 114,
    height: 128,
    borderRadius: 16,
  },
  cardImageBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
  },
  cardContentRight: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  cardFavoriteButton: {
    padding: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 20,
    marginBottom: 4,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  cardDetailText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  cardDetailSeparator: {
    fontSize: 13,
    color: '#9ca3af',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  productButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 4,
  },
  productButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  manageButton: {
    backgroundColor: Colors.primary,
  },
  manageButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  categoryBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
