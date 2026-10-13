import { Card, PressableFeedback, SearchField, Spinner, Surface } from 'heroui-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { useLocale } from '../../context/LocaleContext';
import {
  FORWARD_GEOCODE_MIN_QUERY_LENGTH,
  forwardGeocode,
  type GeocodeSuggestion,
} from '../../lib/mapbox/forwardGeocode';
import { TestId } from '../../testing/testIds';

const GEOCODE_DEBOUNCE_MS = 300;

type Props = {
  accessToken: string;
  proximityLngLat: [number, number];
  onAreaSelect: (lngLat: [number, number], label: string) => void;
};

export function MapAreaSearchField({ accessToken, proximityLngLat, onAreaSelect }: Props) {
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  const [areaLabel, setAreaLabel] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const proximityRef = useRef(proximityLngLat);
  proximityRef.current = proximityLngLat;

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const runSearch = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (trimmed.length < FORWARD_GEOCODE_MIN_QUERY_LENGTH) {
        setSuggestions([]);
        setIsLoading(false);
        setFetchFailed(false);
        setDropdownOpen(false);
        return;
      }

      setIsLoading(true);
      setFetchFailed(false);
      setDropdownOpen(true);

      const result = await forwardGeocode(trimmed, accessToken, proximityRef.current);
      setIsLoading(false);

      if (!result.ok) {
        setSuggestions([]);
        setFetchFailed(true);
        return;
      }

      setSuggestions(result.suggestions);
      setFetchFailed(result.suggestions.length === 0);
    },
    [accessToken],
  );

  const onQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      setAreaLabel(null);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (value.trim().length < FORWARD_GEOCODE_MIN_QUERY_LENGTH) {
        setSuggestions([]);
        setIsLoading(false);
        setFetchFailed(false);
        setDropdownOpen(false);
        return;
      }

      setIsLoading(true);
      setDropdownOpen(true);
      debounceRef.current = setTimeout(() => {
        void runSearch(value);
      }, GEOCODE_DEBOUNCE_MS);
    },
    [runSearch],
  );

  const onClear = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setQuery('');
    setAreaLabel(null);
    setSuggestions([]);
    setIsLoading(false);
    setFetchFailed(false);
    setDropdownOpen(false);
  }, []);

  const onSelectSuggestion = useCallback(
    (suggestion: GeocodeSuggestion) => {
      setQuery(suggestion.label);
      setAreaLabel(suggestion.label);
      setSuggestions([]);
      setDropdownOpen(false);
      setFetchFailed(false);
      onAreaSelect(suggestion.lngLat, suggestion.label);
    },
    [onAreaSelect],
  );

  const showDropdown =
    dropdownOpen &&
    query.trim().length >= FORWARD_GEOCODE_MIN_QUERY_LENGTH &&
    (isLoading || fetchFailed || suggestions.length > 0);

  return (
    <View testID={TestId.mapSearchField} style={{ zIndex: 50 }}>
      <Surface variant="default" className="overflow-hidden rounded-2xl p-0.5">
        <SearchField value={query} onChange={onQueryChange}>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder={t('map.searchPlaceholder')} />
            <SearchField.ClearButton onPress={onClear} />
          </SearchField.Group>
        </SearchField>
      </Surface>

      {areaLabel && !showDropdown ? (
        <Text className="text-muted mt-1 px-1 text-xs" numberOfLines={1}>
          {t('map.lookingAt', { area: areaLabel })}
        </Text>
      ) : null}

      {showDropdown ? (
        <Card className="mt-1 overflow-hidden" style={{ elevation: 8 }}>
          <Card.Body className="gap-0 p-0">
            {isLoading ? (
              <View className="flex-row items-center gap-2 px-3 py-3">
                <Spinner size="sm" />
              </View>
            ) : fetchFailed ? (
              <View className="px-3 py-3">
                <Card.Description>{t('map.searchNoResults')}</Card.Description>
              </View>
            ) : (
              suggestions.map((suggestion) => (
                <PressableFeedback
                  key={suggestion.id}
                  onPress={() => onSelectSuggestion(suggestion)}
                >
                  <View className="px-3 py-3">
                    <Card.Description>{suggestion.label}</Card.Description>
                  </View>
                </PressableFeedback>
              ))
            )}
          </Card.Body>
        </Card>
      ) : null}
    </View>
  );
}
