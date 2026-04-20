import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface SortOptionsProps {
  selectedSort: string;
  onSortChange: (option: string) => void;
}

const SORT_OPTIONS = ['Newest', 'Oldest', 'Highest', 'Lowest'];

const SortOptions: React.FC<SortOptionsProps> = ({ selectedSort, onSortChange }) => {
  return (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      {SORT_OPTIONS.map((option) => {
        const selected = selectedSort === option;
        return (
          <Pressable
            key={option}
            onPress={() => onSortChange(option)}
            style={[
              {
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#6B8E23',
              },
              selected ? { backgroundColor: '#6B8E23' } : { backgroundColor: 'transparent' },
            ]}>
            <Text style={{ fontSize: 14, color: selected ? 'white' : '#6B8E23' }}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default SortOptions;
