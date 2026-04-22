import { Ionicons } from '@expo/vector-icons';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Chip } from 'heroui-native/chip';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { useAppColors } from '~/lib/theme';
import { useAuth } from '~/lib/providers/AuthProvider';
import { ListingRecord } from '~/lib/types/models';
import { getCategoryColor } from '~/lib/utils/categoryHelpers';

interface ListingCardProps {
  item: ListingRecord;
  category: string;
  onPress: () => void;
  onAddFavorite: (id: string) => void;
  onRemoveFavorite: (id: string) => void;
}

const ListingCard = React.memo(function ListingCard({
  item,
  category,
  onPress,
  onAddFavorite,
  onRemoveFavorite,
}: ListingCardProps) {
  const colors = useAppColors();
  const { user } = useAuth();

  const latestPicture = item?.picture;
  const uri = latestPicture?.photo?.url || latestPicture?.url || null;

  const distanceInKm = item?.distance ? (item.distance / 1000).toFixed(1) : '0';
  const numericRating = item?.rating ? Number(item.rating) : 0;
  const isFavorite = item?.favorite;

  if (!item) {
    return null;
  }

  const categoryColor = getCategoryColor(category);

  return (
    <Pressable onPress={onPress}>
      <Card
        className="mx-2 overflow-hidden shadow-sm"
        style={{
          height: 140,
          shadowColor: colors.dark,
          shadowOpacity: 0.08,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}>
        <View className="h-full flex-row">
          <View className="relative h-full w-[110px]">
            <Image
              key={item.id}
              source={uri ? { uri } : require('~/assets/images/default-placeholder.png')}
              className="h-[140px] w-[110px]"
              resizeMode="cover"
            />

            {user ? (
              <View className="absolute right-1.5 top-1.5">
                <Button
                  isIconOnly
                  size="sm"
                  variant="secondary"
                  className="h-7 w-7 rounded-2xl bg-white/95 shadow-sm"
                  onPress={() => {
                    if (isFavorite) onRemoveFavorite(item.id);
                    else onAddFavorite(item.id);
                  }}>
                  <Ionicons
                    name={isFavorite ? 'heart' : 'heart-outline'}
                    size={16}
                    color={isFavorite ? '#FF385C' : '#222'}
                  />
                </Button>
              </View>
            ) : null}
          </View>

          <View className="flex-1 justify-between p-2.5">
            <View className="gap-1">
              <Text className="text-sm font-semibold leading-[18px] text-foreground" numberOfLines={2}>
                {item.name}
              </Text>

              <Text className="text-[11px] text-muted" numberOfLines={1}>
                {item.location?.address || 'Apeldoorn'}
              </Text>
            </View>

            <View className="gap-1">
              <View className="flex-row flex-wrap items-center gap-2">
                <Chip
                  color="default"
                  size="sm"
                  variant="soft"
                  className="px-2 py-1"
                  style={{ backgroundColor: categoryColor }}>
                  <Text className="text-[10px] font-medium text-white">{category}</Text>
                </Chip>

                {numericRating > 0 ? (
                  <Text className="text-[11px] font-semibold" style={{ color: colors.primary }}>
                    {numericRating.toFixed(1)} ⭐
                  </Text>
                ) : null}
                <Text className="text-[11px] text-muted">• {distanceInKm}km</Text>
              </View>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
});

ListingCard.displayName = 'ListingCard';

export default ListingCard;
