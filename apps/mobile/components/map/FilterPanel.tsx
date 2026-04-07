import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

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
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <YStack
          position="absolute"
          backgroundColor={Colors.background.secondary}
          borderRadius={Colors.radius.md}
          {...Colors.shadowTokens.xl}
          zIndex={3}
          maxHeight={300}
          width={240}
          overflow="hidden"
          onStartShouldSetResponder={() => true}>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
            {CATEGORY_OPTIONS.map((category) => {
              const isSelected =
                category.value === 'all'
                  ? selectedCategories.length === 0
                  : selectedCategories.includes(category.value);
              const iconBgColor =
                category.value === 'all'
                  ? isSelected
                    ? Colors.primary
                    : Colors.border.light
                  : isSelected
                    ? getCategoryColor(category.value)
                    : Colors.border.light;
              const iconColor =
                category.value === 'all'
                  ? isSelected
                    ? '#fff'
                    : Colors.text.tertiary
                  : isSelected
                    ? '#fff'
                    : getCategoryColor(category.value);
              const checkColor =
                category.value === 'all' ? Colors.primary : getCategoryColor(category.value);

              return (
                <TouchableOpacity
                  key={category.value}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (category.value === 'all') {
                      selectedCategories.forEach((cat) => onCategoryToggle(cat));
                    } else {
                      onCategoryToggle(category.value);
                    }
                  }}>
                  <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    paddingVertical={14}
                    paddingHorizontal={16}
                    borderBottomWidth={1}
                    borderBottomColor={Colors.border.light}>
                    <XStack alignItems="center" flex={1} gap={12}>
                      <XStack
                        width={32}
                        height={32}
                        borderRadius={16}
                        alignItems="center"
                        justifyContent="center"
                        backgroundColor={iconBgColor}>
                        <FontAwesome5
                          name={
                            (category.value === 'all'
                              ? 'th-large'
                              : getCategoryIcon(category.value)) as any
                          }
                          size={18}
                          color={iconColor}
                          solid={isSelected}
                        />
                      </XStack>
                      <Text fontSize={16} fontWeight="500" color={Colors.text.primary}>
                        {category.label}
                      </Text>
                    </XStack>
                    {isSelected && <Ionicons name="checkmark" size={20} color={checkColor} />}
                  </XStack>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </YStack>
      </>
    );
  }
);
