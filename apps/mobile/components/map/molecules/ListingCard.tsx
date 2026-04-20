import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { useAppColors } from '~/lib/theme';
import { useAuth } from '~/lib/providers/AuthProvider';
import { ListingRecord } from '~/lib/types/models';
import { getCategoryColor } from '~/lib/utils/categoryHelpers';

interface HikeItemProps {
  item: ListingRecord;
  category: string;
  onPress: () => void;
  onAddFavorite: (id: string) => void;
  onRemoveFavorite: (id: string) => void;
}

const ListingCard: React.FC<HikeItemProps> = ({
  item,
  category,
  onPress,
  onAddFavorite,
  onRemoveFavorite,
}) => {
  const colors = useAppColors();
  const { user } = useAuth();

  console.log('🎴 Rendering card for:', item?.name);

  const latestPicture = item?.picture;
  const uri = latestPicture?.photo?.url || latestPicture?.url || null;

  const distanceInKm = item?.distance ? (item.distance / 1000).toFixed(1) : '0';
  const numericRating = item?.rating ? Number(item.rating) : 0;
  const isFavorite = item?.favorite;

  if (!item) {
    console.log('🎴 No item data!');
    return null;
  }

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    if (isFavorite) {
      onRemoveFavorite(item.id);
    } else {
      onAddFavorite(item.id);
    }
  };

  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          backgroundColor: colors.background.secondary,
          borderRadius: 12,
          marginHorizontal: 8,
          height: 140,
          overflow: 'hidden',
          shadowColor: colors.dark,
          shadowOpacity: 0.08,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}>
        <View style={{ flexDirection: 'row', height: '100%' }}>
          <View style={{ position: 'relative', width: 110, height: '100%' }}>
            <Image
              key={item.id}
              source={uri ? { uri } : require('~/assets/images/default-placeholder.png')}
              style={{ width: 110, height: 140 }}
              resizeMode="cover"
            />

            {user && (
              <Pressable
                onPress={handleFavoritePress}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: 16,
                  width: 28,
                  height: 28,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                  elevation: 2,
                }}>
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={16}
                  color={isFavorite ? '#FF385C' : '#222'}
                />
              </Pressable>
            )}
          </View>

          <View style={{ flex: 1, padding: 10, justifyContent: 'space-between' }}>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', lineHeight: 18 }} numberOfLines={2}>
                {item.name}
              </Text>

              <Text style={{ fontSize: 11, color: colors.text.secondary }} numberOfLines={1}>
                {item.location?.address || 'Apeldoorn'}
              </Text>
            </View>

            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <View
                  style={{
                    backgroundColor: getCategoryColor(category),
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}>
                  <Text style={{ fontSize: 10, color: 'white' }}>{category}</Text>
                </View>

                {numericRating > 0 && (
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>
                    {numericRating.toFixed(1)} ⭐
                  </Text>
                )}
                <Text style={{ fontSize: 11, color: colors.text.secondary }}>• {distanceInKm}km</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default ListingCard;
