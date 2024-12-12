import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Colors from '~/constants/Colors';

interface SortOptionsProps {
  selectedSort: string;
  onSortChange: (option: string) => void;
}

const SORT_OPTIONS = ['Newest', 'Oldest', 'Highest', 'Lowest'];

const SortOptions: React.FC<SortOptionsProps> = ({ selectedSort, onSortChange }) => {
  return (
    <View style={styles.sortContainer}>
      {SORT_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.sortButton, selectedSort === option && styles.selectedSortButton]}
          onPress={() => onSortChange(option)}>
          <Text style={{ color: selectedSort === option ? 'white' : 'black' }}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  selectedSortButton: {
    backgroundColor: Colors.primary,
  },
});

export default SortOptions;
