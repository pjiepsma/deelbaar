import { Ionicons } from '@expo/vector-icons';
import { Button } from 'heroui-native/button';
import { Input } from 'heroui-native/input';
import React from 'react';
import { View } from 'react-native';

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
        <Input
          style={{
            flex: 1,
            fontSize: 16,
            color: colors.text.primary,
            padding: 0,
          }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || 'Zoek minibiebs, voedselbanken...'}
        />
        {value ? (
          <Button isIconOnly variant="tertiary" onPress={() => onChangeText('')}>
            <Ionicons name="close-circle" size={20} color={colors.icon.muted} />
          </Button>
        ) : null}
      </View>
    );
  }
);
