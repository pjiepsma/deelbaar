import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

import Colors from '~/constants/Colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

/**
 * Search bar component for filtering listings
 */
export const SearchBar = React.memo<SearchBarProps>(({ value, onChangeText, placeholder }) => {
  return (
    <View style={styles.searchBar}>
      <Ionicons name="search" size={20} color={Colors.text.secondary} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder || 'Zoek minibiebs, voedselbanken...'}
        placeholderTextColor={Colors.text.secondary}
        value={value}
        onChangeText={onChangeText}
      />
      {value ? (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
});
