import { XStack, Button, Text } from 'tamagui';
import React from 'react';

interface SortOptionsProps {
  selectedSort: string;
  onSortChange: (option: string) => void;
}

const SORT_OPTIONS = ['Newest', 'Oldest', 'Highest', 'Lowest'];

const SortOptions: React.FC<SortOptionsProps> = ({ selectedSort, onSortChange }) => {
  return (
    <XStack gap={8} flexWrap="wrap">
      {SORT_OPTIONS.map((option) => (
        <Button
          key={option}
          size="$3"
          variant={selectedSort === option ? 'solid' : 'outline'}
          backgroundColor={selectedSort === option ? '#6B8E23' : 'transparent'}
          borderColor="#6B8E23"
          onPress={() => onSortChange(option)}>
          <Text fontSize={14} color={selectedSort === option ? 'white' : '#6B8E23'}>
            {option}
          </Text>
        </Button>
      ))}
    </XStack>
  );
};

export default SortOptions;
