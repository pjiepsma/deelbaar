import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import Colors from '~/constants/Colors';
import { getCategoryIcon, getCategoryColor } from '~/lib/utils/categoryHelpers';

interface FilterButtonProps {
  active: boolean;
  selectedCategories: string[];
  onPress: () => void;
}

/**
 * Filter button component showing selected category icons
 */
export const FilterButton = React.memo<FilterButtonProps>(
  ({ active, selectedCategories, onPress }) => {
    return (
      <TouchableOpacity
        style={[styles.filterButton, active && styles.filterButtonActive]}
        onPress={onPress}>
        {selectedCategories.length === 0 ? (
          <>
            <FontAwesome5 name="th-large" size={18} color={Colors.primary} solid />
            <Text style={styles.filterButtonText}>Type kast</Text>
          </>
        ) : (
          <View style={styles.filterButtonIcons}>
            {selectedCategories.slice(0, 3).map((category) => (
              <View
                key={category}
                style={[
                  styles.filterButtonIcon,
                  { backgroundColor: getCategoryColor(category) + '20' },
                ]}>
                <FontAwesome5
                  name={getCategoryIcon(category) as any}
                  size={16}
                  color={getCategoryColor(category)}
                  solid
                />
              </View>
            ))}
            {selectedCategories.length > 3 && (
              <View style={styles.filterButtonBadge}>
                <Text style={styles.filterButtonBadgeText}>+{selectedCategories.length - 3}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 100,
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.background.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
  filterButtonIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterButtonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
});
