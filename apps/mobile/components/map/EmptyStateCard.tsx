import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, YStack } from 'tamagui';

import Colors from '~/constants/Colors';
import { CARD_WIDTH, CARD_HEIGHT, CARD_SPACING } from '~/lib/constants/listings';

interface EmptyStateCardProps {
  hasActiveFilters: boolean;
}

/**
 * Empty state card displayed when no listings are found
 */
export const EmptyStateCard = React.memo<EmptyStateCardProps>(
  ({ hasActiveFilters }) => {
    return (
      <YStack
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        borderRadius={Colors.radius.xl}
        backgroundColor={Colors.background.secondary}
        overflow="hidden"
        borderWidth={1}
        borderColor={Colors.border.light}
        marginRight={CARD_SPACING}
        justifyContent="center"
        alignItems="center"
        {...Colors.shadowTokens.lg}>
        <YStack alignItems="center" justifyContent="center" gap={12} padding={20}>
          <Ionicons name="search-outline" size={32} color={Colors.primary} />
          <Text
            fontSize={18}
            fontWeight="600"
            color={Colors.text.primary}
            textAlign="center">
            Geen kasten gevonden
          </Text>
          <Text
            fontSize={14}
            color={Colors.text.secondary}
            textAlign="center"
            lineHeight={20}>
            {hasActiveFilters
              ? 'Probeer andere filters of zoom uit'
              : 'Zoom uit of verplaats de kaart'}
          </Text>
        </YStack>
      </YStack>
    );
  }
);
