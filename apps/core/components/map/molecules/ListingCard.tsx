import { Ionicons } from '@expo/vector-icons';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Chip } from 'heroui-native/chip';
import React, { useMemo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { useAppColors } from '~/lib/theme';
import { useAuth } from '~/lib/providers/AuthProvider';
import type { ListingRecord } from '~/lib/types/models';
import { getCategoryColor } from '~/lib/utils/categoryHelpers';

function coverPhotoUri(item: ListingRecord): string | null {
  const pics = item.pictures;
  if (!pics?.length) return null;
  const row = pics.find((p) => p.status === 'approved') ?? pics[0];
  const photo = row?.photo;
  if (photo && typeof photo === 'object' && 'url' in photo && photo.url) {
    return String(photo.url);
  }
  return null;
}

interface ListingCardProps {
  item: ListingRecord;
  category: string;
  /** Tap main area: select on map / carousel (does not open detail). */
  onSelect: () => void;
  /** Open full listing (modal / screen). */
  onOpenDetail: () => void;
  selected?: boolean;
  onAddFavorite: (id: string) => void;
  onRemoveFavorite: (id: string) => void;
}

const ListingCard = React.memo(function ListingCard({
  item,
  category,
  onSelect,
  onOpenDetail,
  selected,
  onAddFavorite,
  onRemoveFavorite,
}: ListingCardProps) {
  const colors = useAppColors();
  const { user } = useAuth();

  const uri = useMemo(() => coverPhotoUri(item), [item]);

  const distanceLabel = useMemo(() => {
    if (item.distance == null || Number.isNaN(Number(item.distance))) return null;
    const km = Number(item.distance);
    return `${km.toFixed(1)} km`;
  }, [item.distance]);

  const numericRating = item?.rating ? Number(item.rating) : 0;
  const isFavorite = item?.favorite;

  if (!item) {
    return null;
  }

  const categoryColor = getCategoryColor(category);

  return (
    <Card
      className="mx-2 overflow-hidden shadow-sm"
      style={{
        height: 140,
        shadowColor: colors.dark,
        shadowOpacity: selected ? 0.14 : 0.08,
        shadowRadius: selected ? 10 : 6,
        shadowOffset: { width: 0, height: 1 },
        elevation: selected ? 4 : 2,
        borderWidth: selected ? 2 : 0,
        borderColor: selected ? colors.primary : 'transparent',
      }}>
      <View className="h-full flex-row">
        <Pressable
          onPress={onSelect}
          className="h-full min-w-0 flex-1 flex-row"
          accessibilityRole="button"
          accessibilityHint="Selecteer op de kaart">
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

          <View className="min-w-0 flex-1 justify-between p-2.5">
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
                {distanceLabel ? (
                  <Text className="text-[11px] text-muted">• {distanceLabel}</Text>
                ) : null}
              </View>
            </View>
          </View>
        </Pressable>

        <View className="justify-center border-l border-default-200 pr-1 pl-0.5">
          <Pressable
            onPress={onOpenDetail}
            hitSlop={10}
            className="items-center justify-center rounded-full p-1.5"
            accessibilityRole="button"
            accessibilityLabel="Details openen">
            <Ionicons name="chevron-forward-circle" size={30} color={colors.primary} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
});

ListingCard.displayName = 'ListingCard';

export default ListingCard;
