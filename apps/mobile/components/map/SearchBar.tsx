import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Input, XStack } from 'tamagui';
import { TouchableOpacity } from 'react-native';

import Colors from '~/constants/Colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

/**
 * Search bar component for filtering listings
 */
export const SearchBar = React.memo<SearchBarProps>(
  ({ value, onChangeText, placeholder }) => {
    return (
      <XStack
        alignItems="center"
        backgroundColor={Colors.background.secondary}
        borderRadius={Colors.radius.md}
        paddingHorizontal={16}
        paddingVertical={12}
        gap={8}
        marginBottom={8}
        {...Colors.shadowTokens.sm}>
        <Ionicons name="search" size={20} color={Colors.text.secondary} />
        <Input
          flex={1}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || 'Zoek minibiebs, voedselbanken...'}
          placeholderTextColor={Colors.text.secondary}
          fontSize={16}
          color={Colors.text.primary}
          backgroundColor="transparent"
          borderWidth={0}
          padding={0}
          focusStyle={{ borderWidth: 0, outlineStyle: 'none' }}
        />
        {value ? (
          <TouchableOpacity onPress={() => onChangeText('')} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        ) : null}
      </XStack>
    );
  }
);
