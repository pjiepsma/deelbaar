import React from 'react';
import {
  HStack,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';

interface SortOptionsProps {
  selectedSort: string;
  onSortChange: (option: string) => void;
}

const SORT_OPTIONS = ['Newest', 'Oldest', 'Highest', 'Lowest'];

const SortOptions: React.FC<SortOptionsProps> = ({ selectedSort, onSortChange }) => {
  return (
    <HStack space="sm" flexWrap="wrap">
      {SORT_OPTIONS.map((option) => (
        <Button
          key={option}
          size="sm"
          variant={selectedSort === option ? 'solid' : 'outline'}
          bg={selectedSort === option ? '#6B8E23' : 'transparent'}
          borderColor="#6B8E23"
          onPress={() => onSortChange(option)}>
          <ButtonText fontSize="$sm" color={selectedSort === option ? '$white' : '#6B8E23'}>
            {option}
          </ButtonText>
        </Button>
      ))}
    </HStack>
  );
};

export default SortOptions;
