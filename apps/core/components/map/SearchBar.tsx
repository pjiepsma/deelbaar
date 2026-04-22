import React from 'react';
import { SearchField } from 'heroui-native/search-field';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

/**
 * Map search — HeroUI SearchField (icon, input, clear) + Uniwind shell.
 */
export const SearchBar = React.memo(function SearchBar({
  value,
  onChangeText,
  placeholder,
}: SearchBarProps) {
  return (
    <SearchField value={value} onChange={onChangeText} className="mb-2">
      <SearchField.Group className="flex-row items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-3 shadow-sm">
        <SearchField.SearchIcon />
        <SearchField.Input
          placeholder={placeholder || 'Zoek minibiebs, voedselbanken...'}
          className="min-h-0 flex-1 bg-transparent"
        />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
});

SearchBar.displayName = 'SearchBar';
