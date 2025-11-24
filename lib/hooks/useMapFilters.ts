import { useEffect, useState, useMemo, useCallback } from 'react';
import { Region } from 'react-native-maps';

import { ListingRecord } from '../types/models';

export interface MapFilters {
  searchQuery: string;
  selectedCategories: string[];
  selectedLocationFeatures: string[];
}

interface UseMapFiltersOptions {
  cachedListings: ListingRecord[];
  region: Region;
  initialFilters?: Partial<MapFilters>;
  onFiltersChange?: (filters: MapFilters) => void;
}

/**
 * Hook to manage map filters and filtered listings
 * Handles search query debouncing, category filtering, and location feature filtering
 */
export function useMapFilters({
  cachedListings,
  region,
  initialFilters,
  onFiltersChange,
}: UseMapFiltersOptions) {
  // Search and filters state
  const [searchQuery, setSearchQuery] = useState(initialFilters?.searchQuery || '');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(
    initialFilters?.searchQuery || ''
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialFilters?.selectedCategories || []
  );
  const [selectedLocationFeatures, setSelectedLocationFeatures] = useState<string[]>(
    initialFilters?.selectedLocationFeatures || []
  );

  // Only debounce search text input (nothing else!)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Notify parent of filter changes
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        searchQuery,
        selectedCategories,
        selectedLocationFeatures,
      });
    }
  }, [searchQuery, selectedCategories, selectedLocationFeatures, onFiltersChange]);

  // Client-side filtering for carousel (visible listings within viewport)
  const visibleListings = useMemo(() => {
    if (!cachedListings.length) return [];

    let filtered = cachedListings;

    // 1. Filter by map bounds
    const latHalf = region.latitudeDelta / 2;
    const lonHalf = region.longitudeDelta / 2;
    const minLat = region.latitude - latHalf;
    const maxLat = region.latitude + latHalf;
    const minLon = region.longitude - lonHalf;
    const maxLon = region.longitude + lonHalf;

    filtered = filtered.filter((l) => {
      const coords = l.location?.coordinates;
      if (!coords || coords.length < 2) return false;
      const [lon, lat] = coords;
      return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
    });

    // 2. Filter by category
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((l) => selectedCategories.includes(l.category || ''));
    }

    // 3. Filter by search query (debounced)
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.name?.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.location?.address?.toLowerCase().includes(q)
      );
    }

    // 4. Filter by location features
    if (selectedLocationFeatures.length > 0) {
      filtered = filtered.filter((l) => {
        let matches = true;

        if (selectedLocationFeatures.includes('near_public_transport')) {
          const address = l.location?.address?.toLowerCase() || '';
          matches = matches && /\b(station|halte|metro|tram|bus|trein)\b/.test(address);
        }

        if (selectedLocationFeatures.includes('parking_available')) {
          // Check address for parking mentions since facilities field doesn't exist
          const address = l.location?.address?.toLowerCase() || '';
          matches = matches && /\b(parking|parkeer)\b/.test(address);
        }

        if (selectedLocationFeatures.includes('wheelchair_accessible')) {
          // Check address for accessibility mentions
          const address = l.location?.address?.toLowerCase() || '';
          matches = matches && /\b(rolstoel|toegankelijk|wheelchair|accessible)\b/.test(address);
        }

        return matches;
      });
    }

    return filtered;
  }, [cachedListings, region, selectedCategories, debouncedSearchQuery, selectedLocationFeatures]);

  // Map markers - show all loaded listings (no map bounds filter)
  const mapMarkers = useMemo(() => {
    if (!cachedListings.length) return [];

    let filtered = cachedListings;

    // Apply all filters EXCEPT map bounds (keep listings visible on map)
    // 1. Filter by category
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((l) => selectedCategories.includes(l.category || ''));
    }

    // 2. Filter by search query
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.name?.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.location?.address?.toLowerCase().includes(q)
      );
    }

    // 3. Filter by location features
    if (selectedLocationFeatures.length > 0) {
      filtered = filtered.filter((l) => {
        let matches = true;
        if (selectedLocationFeatures.includes('near_public_transport')) {
          const address = l.location?.address?.toLowerCase() || '';
          matches = matches && /\b(station|halte|metro|tram|bus|trein)\b/.test(address);
        }
        if (selectedLocationFeatures.includes('parking_available')) {
          // Check address for parking mentions since facilities field doesn't exist
          const address = l.location?.address?.toLowerCase() || '';
          matches = matches && /\b(parking|parkeer)\b/.test(address);
        }
        if (selectedLocationFeatures.includes('wheelchair_accessible')) {
          // Check address for accessibility mentions
          const address = l.location?.address?.toLowerCase() || '';
          matches = matches && /\b(rolstoel|toegankelijk|wheelchair|accessible)\b/.test(address);
        }
        return matches;
      });
    }

    // Filter out listings without valid coordinates
    return filtered.filter((l) => {
      const coords = l.location?.coordinates;
      return coords && coords.length >= 2;
    });
  }, [cachedListings, selectedCategories, debouncedSearchQuery, selectedLocationFeatures]);

  // Helper to check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return selectedCategories.length > 0 || searchQuery.trim().length > 0;
  }, [selectedCategories, searchQuery]);

  // Filter setter helpers
  const updateCategories = useCallback((categories: string[]) => {
    setSelectedCategories(categories);
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  }, []);

  const updateLocationFeatures = useCallback((features: string[]) => {
    setSelectedLocationFeatures(features);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedLocationFeatures([]);
  }, []);

  return {
    // State
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    selectedCategories,
    selectedLocationFeatures,
    // Filtered data
    visibleListings,
    mapMarkers,
    hasActiveFilters,
    // Setters
    updateCategories,
    toggleCategory,
    updateLocationFeatures,
    clearFilters,
  };
}
