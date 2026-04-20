import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';

import { useAppColors } from '~/lib/theme';

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
    const colors = useAppColors();
    return (
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.background.secondary,
            borderRadius: colors.radius.md,
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 8,
            marginBottom: 8,
          },
          colors.shadowTokens.sm,
        ]}>
        <Ionicons name="search" size={20} color={colors.icon.muted} />
        <TextInput
          style={{
            flex: 1,
            fontSize: 16,
            color: colors.text.primary,
            padding: 0,
          }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || 'Zoek minibiebs, voedselbanken...'}
          placeholderTextColor={colors.text.secondary}
        />
        {value ? (
          <TouchableOpacity onPress={() => onChangeText('')} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={colors.icon.muted} />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
);
