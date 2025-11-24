import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import Colors from '~/constants/Colors';
import { CARD_WIDTH, CARD_HEIGHT, CARD_SPACING } from '~/lib/constants/listings';

interface EmptyStateCardProps {
  hasActiveFilters: boolean;
}

/**
 * Empty state card displayed when no listings are found
 */
export const EmptyStateCard = React.memo<EmptyStateCardProps>(({ hasActiveFilters }) => {
  return (
    <TouchableOpacity activeOpacity={1} style={[styles.card, styles.emptyStateCard]} disabled>
      <View style={styles.emptyCardContent}>
        <Ionicons name="search-outline" size={32} color={Colors.primary} />
        <Text style={styles.emptyCardTitle}>Geen kasten gevonden</Text>
        <Text style={styles.emptyCardSubtitle}>
          {hasActiveFilters
            ? 'Probeer andere filters of zoom uit'
            : 'Zoom uit of verplaats de kaart'}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

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
    marginRight: CARD_SPACING,
  },
  emptyStateCard: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
  },
  emptyCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  emptyCardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
