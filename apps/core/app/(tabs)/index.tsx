import { useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapCategoryFilter } from '~/components/map/MapCategoryFilter';
import { SearchBar } from '~/components/map/SearchBar';
import ListingCarousel from '~/components/map/organisms/ListingCarousel';
import ListingsMapNew from '~/components/map/organisms/ListingsMapNew';
import { useAuth } from '~/lib/providers/AuthProvider';
import { useUser } from '~/lib/providers/UserProvider';
import type { ListingRecord } from '~/lib/types/models';

export default function MapTabScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingRecord[]>([]);
  const [listing, setListing] = useState<ListingRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapCenterCity, setMapCenterCity] = useState<string | null>(null);
  const { profile } = useUser();
  const accountCity = profile?.address?.city?.trim() || null;
  const searchScope = 'city';
  const searchRadius = 15_000;

  const filteredListings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return listings.filter((item) => {
      const categoryMatch =
        selectedCategories.length === 0 ||
        selectedCategories.includes(item.category || 'other');

      if (!categoryMatch) return false;
      if (!normalizedQuery) return true;

      const haystack = [item.name, item.description, item.location?.address]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [listings, searchQuery, selectedCategories]);

  const activeCategory = selectedCategories.length === 1 ? selectedCategories[0] : 'all';

  useEffect(() => {
    if (listing && !filteredListings.some((item) => item.id === listing.id)) {
      setListing(null);
    }
  }, [filteredListings, listing]);

  useEffect(() => {
    if (!mapCenter) return;
    const timeout = setTimeout(() => {
      void (async () => {
        try {
          const places = await Location.reverseGeocodeAsync({
            latitude: mapCenter.latitude,
            longitude: mapCenter.longitude,
          });
          const city = places?.[0]?.city?.trim() || places?.[0]?.subregion?.trim() || null;
          setMapCenterCity(city);
        } catch {
          setMapCenterCity(null);
        }
      })();
    }, 400);
    return () => clearTimeout(timeout);
  }, [mapCenter]);

  const emptySubtleMessage = useMemo(() => {
    if (!user) return null;
    if (filteredListings.length > 0) return null;
    if (!accountCity || !mapCenterCity) return null;
    if (accountCity.toLowerCase() === mapCenterCity.toLowerCase()) return null;
    return `Je zoekt nu in ${mapCenterCity}. Je gratis gebied is ${accountCity}.`;
  }, [accountCity, filteredListings.length, mapCenterCity, user]);

  const handleCategoryToggle = (category: string) => {
    if (category === 'all') {
      setSelectedCategories([]);
      return;
    }

    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((value) => value !== category) : [...prev, category],
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.controls, { top: insets.top + 10 }]}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        <View style={styles.filterRow}>
          <MapCategoryFilter
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
          />
        </View>
      </View>
      <ListingsMapNew
        category={activeCategory}
        listings={filteredListings}
        setListings={setListings}
        listing={listing}
        setListing={setListing}
        searchScope={searchScope}
        searchRadius={searchRadius}
        onMapCenterChange={setMapCenter}
      />
      <ListingCarousel
        category={activeCategory}
        listings={filteredListings}
        listing={listing}
        setListing={setListing}
        emptySubtleMessage={emptySubtleMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 30,
  },
  filterRow: {
    alignItems: 'flex-start',
  },
});
