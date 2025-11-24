import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

import Colors from '~/constants/Colors';
import { getCategoryIcon, getCategoryColor } from '~/lib/utils/categoryHelpers';

interface FilterPanelProps {
  visible: boolean;
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  onClose: () => void;
}

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Alle kasten', icon: 'grid' },
  { value: 'book', label: 'Boekenkast' },
  { value: 'food', label: 'Voedselkast' },
  { value: 'hygiene', label: 'Hygiënekast' },
  { value: 'community', label: 'Gemeenschapskast' },
  { value: 'other', label: 'Anders' },
];

/**
 * Filter panel component for selecting listing categories
 */
export const FilterPanel = React.memo<FilterPanelProps>(
  ({ visible, selectedCategories, onCategoryToggle, onClose }) => {
    if (!visible) return null;

    return (
      <>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.filterPanel} onStartShouldSetResponder={() => true}>
          <ScrollView style={styles.filterList} showsVerticalScrollIndicator={false}>
            {CATEGORY_OPTIONS.map((category) => {
              const isSelected =
                category.value === 'all'
                  ? selectedCategories.length === 0
                  : selectedCategories.includes(category.value);
              return (
                <TouchableOpacity
                  key={category.value}
                  style={styles.filterListItem}
                  onPress={() => {
                    if (category.value === 'all') {
                      // Clear all categories when "all" is selected
                      selectedCategories.forEach((cat) => onCategoryToggle(cat));
                    } else {
                      onCategoryToggle(category.value);
                    }
                  }}>
                  <View style={styles.filterListItemLeft}>
                    <View
                      style={[
                        styles.filterListItemIcon,
                        {
                          backgroundColor: isSelected
                            ? getCategoryColor(category.value)
                            : '#e5e7eb',
                        },
                      ]}>
                      {category.value === 'all' ? (
                        <FontAwesome5
                          name="th-large"
                          size={18}
                          color={isSelected ? '#fff' : '#6b7280'}
                          solid={isSelected}
                        />
                      ) : (
                        <FontAwesome5
                          name={getCategoryIcon(category.value) as any}
                          size={18}
                          color={isSelected ? '#fff' : getCategoryColor(category.value)}
                          solid={isSelected}
                        />
                      )}
                    </View>
                    <Text style={styles.filterListItemText}>{category.label}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={
                        category.value === 'all' ? Colors.primary : getCategoryColor(category.value)
                      }
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </>
    );
  }
);

const styles = StyleSheet.create({
  filterPanel: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 3,
    maxHeight: 300,
    width: 240,
    overflow: 'hidden',
  },
  filterList: {
    maxHeight: 300,
  },
  filterListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  filterListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterListItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  filterListItemText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
});
