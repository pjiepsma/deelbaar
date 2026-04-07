import { Ionicons } from '@expo/vector-icons';
import { YStack, XStack, Text } from 'tamagui';
import React from 'react';
import { Image, Pressable } from 'react-native';

import Colors from '~/constants/Colors';
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
  const { user } = useAuth();

  console.log('🎴 Rendering card for:', item?.name);

  // Handle Payload media structure
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
      <YStack
        backgroundColor="white"
        borderRadius={12}
        marginHorizontal={8}
        height={140}
        overflow="hidden"
        shadowColor="black"
        shadowOpacity={0.08}
        shadowRadius={6}
        shadowOffset={{ width: 0, height: 1 }}
        elevationAndroid={2}>
        <XStack height="100%">
          {/* Image Section - Left side - Smaller */}
          <YStack position="relative" width={110} height="100%">
            <Image
              key={item.id}
              source={uri ? { uri } : require('assets/images/default-placeholder.png')}
              style={{ width: 110, height: 140 }}
              resizeMode="cover"
            />

            {/* Favorite Button - Smaller */}
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
          </YStack>

          {/* Content Section - Right side - Compact */}
          <YStack flex={1} padding={10} justifyContent="space-between">
            {/* Title & Location */}
            <YStack gap={4}>
              <Text fontSize={14} fontWeight="600" numberOfLines={2} lineHeight={18}>
                {item.name}
              </Text>

              <Text fontSize={11} color="#6b7280" numberOfLines={1}>
                {item.location?.address || 'Apeldoorn'}
              </Text>
            </YStack>

            {/* Bottom Info */}
            <YStack gap={4}>
              <XStack gap={8} alignItems="center" flexWrap="wrap">
                <XStack
                  backgroundColor={getCategoryColor(category)}
                  paddingHorizontal={8}
                  paddingVertical={4}
                  borderRadius={6}>
                  <Text fontSize={10} color="white">{category}</Text>
                </XStack>

                {numericRating > 0 && (
                  <Text fontSize={11} fontWeight="600" color={Colors.primary}>
                    {numericRating.toFixed(1)} ⭐
                  </Text>
                )}
                <Text fontSize={11} color="#6b7280">
                  • {distanceInKm}km
                </Text>
              </XStack>
            </YStack>
          </YStack>
        </XStack>
      </YStack>
    </Pressable>
  );
};

export default ListingCard;
