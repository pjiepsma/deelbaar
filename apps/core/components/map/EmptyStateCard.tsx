import { Ionicons } from '@expo/vector-icons';
import { Card } from 'heroui-native/card';
import React from 'react';
import { Text, View } from 'react-native';

import { CARD_HEIGHT, CARD_SPACING, CARD_WIDTH } from '~/lib/constants/listings';
import { useAppColors } from '~/lib/theme';

interface EmptyStateCardProps {
  hasActiveFilters: boolean;
}

/**
 * Empty state in listing carousel — HeroUI Card + fixed carousel dimensions.
 */
export const EmptyStateCard = React.memo(function EmptyStateCard({ hasActiveFilters }: EmptyStateCardProps) {
  const colors = useAppColors();
  return (
    <Card
      className="justify-center overflow-hidden shadow-sm"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        marginRight: CARD_SPACING,
      }}>
      <Card.Body className="flex-1 items-center justify-center gap-3 px-5 py-5">
        <View className="items-center justify-center gap-3">
          <Ionicons name="search-outline" size={32} color={colors.primary} />
          <Text className="text-center text-lg font-semibold text-foreground">Geen kasten gevonden</Text>
          <Text className="text-center text-sm leading-5 text-muted">
            {hasActiveFilters ? 'Probeer andere filters of zoom uit' : 'Zoom uit of verplaats de kaart'}
          </Text>
        </View>
      </Card.Body>
    </Card>
  );
});

EmptyStateCard.displayName = 'EmptyStateCard';
