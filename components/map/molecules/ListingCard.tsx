import { Ionicons } from '@expo/vector-icons';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  BadgeText,
  Pressable as GluestackPressable,
} from '@gluestack-ui/themed';
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
    <GluestackPressable onPress={onPress}>
      <Box
        bg="$white"
        borderRadius="$lg"
        mx="$2"
        h={140}
        overflow="hidden"
        shadowColor="$black"
        shadowOpacity={0.08}
        shadowRadius={6}
        shadowOffset={{ width: 0, height: 1 }}
        $android-elevation={2}>
        <HStack h="$full">
          {/* Image Section - Left side - Smaller */}
          <Box position="relative" w={110} h="$full">
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
          </Box>

          {/* Content Section - Right side - Compact */}
          <VStack flex={1} p="$2.5" justifyContent="space-between">
            {/* Title & Location */}
            <VStack space="2xs">
              <Heading size="xs" numberOfLines={2} lineHeight="$sm">
                {item.name}
              </Heading>

              <Text size="2xs" color="$coolGray500" numberOfLines={1}>
                {item.location?.address || 'Apeldoorn'}
              </Text>
            </VStack>

            {/* Bottom Info */}
            <VStack space="2xs">
            <HStack space="xs" alignItems="center" flexWrap="wrap">
              <Badge variant="solid" bg={getCategoryColor(category)} size="sm">
                <BadgeText fontSize={10} color={Colors.white}>
                  {category}
                </BadgeText>
              </Badge>

              {numericRating > 0 && (
                <Text size="2xs" fontWeight="$semibold" color={Colors.primary}>
                  {numericRating.toFixed(1)} ⭐
                </Text>
              )}
              <Text size="2xs" color="$coolGray500">
                • {distanceInKm}km
              </Text>
            </HStack>
            </VStack>
          </VStack>
        </HStack>
      </Box>
    </GluestackPressable>
  );
};

export default ListingCard;
