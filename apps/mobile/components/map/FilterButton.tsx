import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { Button, Text, XStack } from 'tamagui';

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
      <Button
        unstyled
        onPress={onPress}
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        backgroundColor={active ? Colors.background.secondary : Colors.background.tertiary}
        borderWidth={1}
        borderColor={Colors.border.light}
        borderRadius={Colors.radius.md}
        paddingHorizontal={16}
        paddingVertical={12}
        minWidth={100}
        gap={6}
        {...Colors.shadowTokens.md}
        pressStyle={{ opacity: 0.9 }}>
        {selectedCategories.length === 0 ? (
          <>
            <FontAwesome5 name="th-large" size={18} color={Colors.primary} solid />
            <Text fontSize={14} fontWeight="600" color={Colors.primary}>
              Type kast
            </Text>
          </>
        ) : (
          <XStack gap={6} alignItems="center">
            {selectedCategories.slice(0, 3).map((category) => (
              <XStack
                key={category}
                width={28}
                height={28}
                borderRadius={14}
                alignItems="center"
                justifyContent="center"
                backgroundColor={getCategoryColor(category) + '20'}>
                <FontAwesome5
                  name={getCategoryIcon(category) as any}
                  size={16}
                  color={getCategoryColor(category)}
                  solid
                />
              </XStack>
            ))}
            {selectedCategories.length > 3 && (
              <XStack
                backgroundColor={Colors.primary}
                borderRadius={Colors.radius.md}
                paddingHorizontal={6}
                paddingVertical={2}
                minWidth={24}
                alignItems="center"
                justifyContent="center">
                <Text fontSize={11} fontWeight="600" color="#fff">
                  +{selectedCategories.length - 3}
                </Text>
              </XStack>
            )}
          </XStack>
        )}
      </Button>
    );
  }
);
