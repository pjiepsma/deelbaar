import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'tamagui';

import ProductOfferingsManager from '~/components/ProductOfferingsManager';
import ProductOfferingsViewer from '~/components/ProductOfferingsViewer';
import { FilterButton } from '~/components/map/FilterButton';
import { FilterPanel } from '~/components/map/FilterPanel';
import { ListingCarousel } from '~/components/map/ListingCarousel';
import { MapViewWithMarkersGate } from '~/components/map/MapViewWithMarkersGate';
import { SearchBar } from '~/components/map/SearchBar';
import Colors from '~/constants/Colors';
import { useListingsCarousel } from '~/lib/hooks/useListingsCarousel';
import { useMapData } from '~/lib/hooks/useMapData';
import { useMapFilters } from '~/lib/hooks/useMapFilters';
import { useMapView } from '~/lib/hooks/useMapView';
import { useFavorites, useToggleFavorite } from '~/lib/hooks/usePayloadQuery';
import { useAuth } from '~/lib/providers/AuthProvider';
import { ListingRecord } from '~/lib/types/models';
import { isListingOwner } from '~/lib/utils/listingHelpers';

export default function SearchTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  // Map view state and handlers
  const mapView = useMapView();

  // Fetch listings based on map region
  const { cachedListings, isInitialLoading } = useMapData(mapView.region);

  // Filter listings
  const filters = useMapFilters({
    cachedListings,
    region: mapView.region,
  });

  // Carousel state and handlers
  const carousel = useListingsCarousel({
    visibleListings: filters.visibleListings,
    onItemSelect: (item) => {
      mapView.setSelectedId(item.id);
    },
  });

  // Update mapView to scroll carousel when listing is selected
  const handleMapListingSelect = useCallback(
    (listing: ListingRecord) => {
      mapView.handleSelectListing(listing);
      carousel.scrollToListing(listing);
    },
    [mapView, carousel]
  );

  // Favorites
  const { data: favoritesData = [] } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const favorites = useMemo(() => (user ? favoritesData : []), [favoritesData, user]);

  const favoriteIds = useMemo(() => {
    const ids = new Set<string>();
    favorites.forEach((favorite: any) => {
      const favId =
        typeof favorite.listing === 'string'
          ? favorite.listing
          : (favorite.listing?.id ?? favorite.listing_id);
      if (favId) {
        ids.add(favId);
      }
    });
    return ids;
  }, [favorites]);

  // Product offerings modals
  const [showProductViewer, setShowProductViewer] = useState(false);
  const [showProductManager, setShowProductManager] = useState(false);
  const [selectedListingForProducts, setSelectedListingForProducts] =
    useState<ListingRecord | null>(null);

  // Filter panel visibility
  const [showFilters, setShowFilters] = useState(false);

  // Locate user on mount
  useEffect(() => {
    mapView.locateUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers
  const handleOpenDetailPage = useCallback(
    (listing: ListingRecord) => {
      const coords = listing.location?.coordinates;
      const params: Record<string, string> = { id: listing.id };

      // Add distance if available
      if (typeof listing.distance === 'number') {
        params.dist_meters = (listing.distance * 1000).toString();
      }

      // Add coordinates if available
      if (coords && coords.length >= 2) {
        params.lat = coords[1].toString();
        params.long = coords[0].toString();
      }

      router.push({
        pathname: '/(modals)/listing/[id]',
        params,
      });
    },
    [router]
  );

  const handleViewProducts = useCallback((listing: ListingRecord) => {
    setSelectedListingForProducts(listing);
    setShowProductViewer(true);
  }, []);

  const handleManageProducts = useCallback((listing: ListingRecord) => {
    setSelectedListingForProducts(listing);
    setShowProductManager(true);
  }, []);

  const handleToggleFavorite = useCallback(
    (listingId: string, currentlyFavorite: boolean) => {
      console.log('[SearchTab] handleToggleFavorite called', {
        listingId,
        currentlyFavorite,
        user: !!user,
      });

      if (!user) {
        console.warn('[SearchTab] Cannot toggle favorite - user not authenticated');
        Alert.alert('Inloggen vereist', 'Log in om favorieten op te slaan.');
        return;
      }

      toggleFavorite.mutate(
        { listingId, isFavorite: currentlyFavorite },
        {
          onSuccess: () => {
            console.log('[SearchTab] toggleFavorite mutation succeeded', { listingId });
          },
          onError: (error: any) => {
            console.error('[SearchTab] toggleFavorite mutation failed', { listingId, error });
            Alert.alert('Fout', error?.message || 'Kon favoriet niet bijwerken.');
          },
        }
      );
    },
    [toggleFavorite, user]
  );

  return (
    <View style={styles.container}>
      <MapViewWithMarkersGate
        mapRef={mapView.mapRef}
        region={mapView.region}
        markers={filters.mapMarkers}
        selectedId={mapView.selectedId}
        onRegionChangeComplete={mapView.handleRegionChangeComplete}
        onMarkerPress={handleMapListingSelect}
      />

      {/* Search and Filter Controls */}
      <View
        style={[
          styles.searchContainer,
          {
            top: 8 + insets.top,
            left: 16 + insets.left,
            right: 16 + insets.right,
          },
        ]}>
        <SearchBar
          value={filters.searchQuery}
          onChangeText={filters.setSearchQuery}
          placeholder="Zoek minibiebs, voedselbanken..."
        />

        <View style={styles.filterRow}>
          <FilterButton
            active={filters.selectedCategories.length > 0}
            selectedCategories={filters.selectedCategories}
            onPress={() => setShowFilters(!showFilters)}
          />

          <Button
            onPress={mapView.locateUser}
            disabled={mapView.requestingLocation}
            backgroundColor={Colors.primary}
            borderRadius={Colors.radius.md}
            paddingHorizontal={14}
            paddingVertical={10}
            opacity={mapView.requestingLocation ? 0.7 : 1}
            pressStyle={{ opacity: 0.9 }}
            {...Colors.shadowTokens.md}>
            <Ionicons
              name={mapView.requestingLocation ? 'time' : 'locate'}
              size={18}
              color={Colors.white}
            />
          </Button>
        </View>
      </View>

      {/* Filter Panel */}
      <FilterPanel
        visible={showFilters}
        selectedCategories={filters.selectedCategories}
        onCategoryToggle={filters.toggleCategory}
        onClose={() => setShowFilters(false)}
      />

      {/* Listing Carousel */}
      <ListingCarousel
        listings={filters.visibleListings}
        selectedId={mapView.selectedId}
        carouselRef={carousel.carouselRef}
        isInitialLoading={isInitialLoading}
        hasActiveFilters={filters.hasActiveFilters}
        favoriteIds={favoriteIds}
        userLocation={mapView.userLocation}
        userId={user?.id || null}
        onItemPress={handleOpenDetailPage}
        onToggleFavorite={handleToggleFavorite}
        onViewProducts={handleViewProducts}
        onManageProducts={handleManageProducts}
        onViewableItemsChanged={carousel.handleViewableItemsChanged}
        paddingBottom={Math.max(24, insets.bottom + 16)}
      />

      {/* Product Offerings Modals */}
      {showProductViewer && selectedListingForProducts && (
        <View style={styles.modalOverlay}>
          <ProductOfferingsViewer
            listingId={selectedListingForProducts.id}
            listingName={selectedListingForProducts.name || 'Onbekende locatie'}
            isOwner={isListingOwner(selectedListingForProducts, user?.id || null)}
            onManage={() => {
              setShowProductViewer(false);
              setShowProductManager(true);
            }}
          />
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => {
              setShowProductViewer(false);
              setSelectedListingForProducts(null);
            }}
          />
        </View>
      )}

      {showProductManager && selectedListingForProducts && (
        <View style={styles.modalOverlay}>
          <ProductOfferingsManager
            listingId={selectedListingForProducts.id}
            listingName={selectedListingForProducts.name || 'Onbekende locatie'}
            onClose={() => {
              setShowProductManager(false);
              setSelectedListingForProducts(null);
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  searchContainer: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    zIndex: 2,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
