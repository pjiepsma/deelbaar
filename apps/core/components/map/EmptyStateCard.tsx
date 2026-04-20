import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { useAppColors } from '~/lib/theme';
import { CARD_WIDTH, CARD_HEIGHT, CARD_SPACING } from '~/lib/constants/listings';

interface EmptyStateCardProps {
  hasActiveFilters: boolean;
}

/**
 * Empty state card displayed when no listings are found
 */
export const EmptyStateCard = React.memo<EmptyStateCardProps>(
  ({ hasActiveFilters }) => {
    const colors = useAppColors();
    return (
      <View
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: colors.radius.md,
          backgroundColor: colors.background.secondary,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border.light,
          marginRight: CARD_SPACING,
          justifyContent: 'center',
          alignItems: 'center',
          ...colors.shadowTokens.mapCard,
        }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
          <Ionicons name="search-outline" size={32} color={colors.primary} />
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text.primary, textAlign: 'center' }}>
            Geen kasten gevonden
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.text.secondary,
              textAlign: 'center',
              lineHeight: 20,
            }}>
            {hasActiveFilters ? 'Probeer andere filters of zoom uit' : 'Zoom uit of verplaats de kaart'}
          </Text>
        </View>
      </View>
    );
  }
);
