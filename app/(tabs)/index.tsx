import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useClusterer, isClusterFeature } from 'react-native-clusterer';
import MapView, { Marker, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ProductOfferingsManager from '~/components/ProductOfferingsManager';
import ProductOfferingsViewer from '~/components/ProductOfferingsViewer';
import Colors from '~/constants/Colors';
import { payloadClient } from '~/lib/api/PayloadClient';
import { paperMapStyle } from '~/lib/constants/mapStyle';
import { useListingsInBounds } from '~/lib/hooks/useLocationQueries';
import { useFavorites, useToggleFavorite } from '~/lib/hooks/usePayloadQuery';
import { useAuth } from '~/lib/providers/AuthProvider';
import { ListingRecord } from '~/lib/types/models';

const FALLBACK_REGION: Region = {
  latitude: 52.0907,
  longitude: 5.1214,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

const CARD_WIDTH = Dimensions.get('window').width * 0.86;
const CARD_HEIGHT = 160;

// Stable marker component to prevent blinking
const StableMarker = React.memo<{
  listing: ListingRecord;
  isSelected: boolean;
  onPress: () => void;
  getCategoryIcon: (category: string) => string;
}>(({ listing, isSelected, onPress, getCategoryIcon }) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    // Allow initial render, then disable tracking to prevent blinking
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const coords = listing.location?.coordinates;
  if (!coords || coords.length < 2) return null;

  const categoryIcon = getCategoryIcon(listing.category);

  // Icon color matching map style - use gray from map labels (#878787) or darker for selected
  const iconColor = isSelected ? '#5a5a5a' : '#878787';

  return (
    <Marker
      coordinate={{ latitude: coords[1], longitude: coords[0] }}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}>
      <View style={styles.marker}>
        <Ionicons name={categoryIcon as any} size={24} color={iconColor} />
      </View>
    </Marker>
  );
});

export default function SearchTab() {
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  // ============ SINGLE SOURCE OF TRUTH ============
  // Primary data cache - all data flows from here
  const [cachedListings, setCachedListings] = useState<ListingRecord[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // UI state
  const [region, setRegion] = useState<Region>(FALLBACK_REGION);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [selectedLocationFeatures, setSelectedLocationFeatures] = useState<string[]>([]);

  // Product offerings modals
  const [showProductViewer, setShowProductViewer] = useState(false);
  const [showProductManager, setShowProductManager] = useState(false);
  const [selectedListingForProducts, setSelectedListingForProducts] =
    useState<ListingRecord | null>(null);

  // Only debounce search text input (nothing else!)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Track last fetched area
  const lastFetchedCenter = useRef<{ lat: number; lon: number } | null>(null);

  // Calculate bounds for fetching - use larger area (100km radius)
  const currentBounds = useMemo(() => {
    const latHalf = region.latitudeDelta * 2.5; // Fetch 5x larger area
    const lonHalf = region.longitudeDelta * 2.5;

    return {
      northEast: {
        lat: region.latitude + latHalf,
        lon: region.longitude + lonHalf,
      },
      southWest: {
        lat: region.latitude - latHalf,
        lon: region.longitude - lonHalf,
      },
    };
  }, [region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]);

  // Fetch listings - manual control
  const { refetch: fetchListings } = useListingsInBounds(currentBounds, {
    enabled: false, // Manual control
  });

  // Fetch when region changes significantly (>30km from last fetch)
  useEffect(() => {
    const shouldFetch = () => {
      // Always fetch if we have no listings
      if (cachedListings.length === 0) return true;

      // Don't fetch if no last center (initial state)
      if (!lastFetchedCenter.current) return true;

      // Calculate distance from last fetch center
      const R = 6371; // Earth radius in km
      const dLat = ((region.latitude - lastFetchedCenter.current.lat) * Math.PI) / 180;
      const dLon = ((region.longitude - lastFetchedCenter.current.lon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lastFetchedCenter.current.lat * Math.PI) / 180) *
          Math.cos((region.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      // Fetch if moved >30km
      return distance > 30;
    };

    if (shouldFetch()) {
      setIsInitialLoading(true);
      fetchListings().then((result) => {
        const data = result.data as { docs: ListingRecord[] } | undefined;
        if (data?.docs) {
          // Merge new listings with existing (dedupe by id)
          const merged = [...cachedListings];
          data.docs.forEach((newListing) => {
            if (!merged.find((l) => l.id === newListing.id)) {
              merged.push(newListing);
            }
          });
          setCachedListings(merged);
          lastFetchedCenter.current = {
            lat: region.latitude,
            lon: region.longitude,
          };
        }
        setIsInitialLoading(false);
      });
    }
  }, [region.latitude, region.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Category helpers (memoized)
  const getCategoryIcon = useCallback((category: string) => {
    switch (category) {
      case 'book':
        return 'library';
      case 'food':
        return 'storefront';
      case 'hygiene':
        return 'medical';
      case 'community':
        return 'restaurant';
      default:
        return 'pin';
    }
  }, []);

  const getCategoryColor = useCallback((category: string) => {
    switch (category) {
      case 'book':
        return '#3B82F6';
      case 'food':
        return '#EF4444';
      case 'hygiene':
        return '#EC4899';
      case 'community':
        return '#22C55E';
      default:
        return '#6B7280';
    }
  }, []);

  const getCategoryDisplayName = useCallback((category: string) => {
    switch (category) {
      case 'book':
        return 'Minibieb';
      case 'food':
        return 'Voedselkast';
      case 'hygiene':
        return 'Hygiënekast';
      case 'community':
        return 'Gemeenschapskast';
      case 'other':
        return 'Anders';
      default:
        return 'Locatie';
    }
  }, []);

  // Helper function to extract first approved image URL
  const getFirstImageUrl = useCallback((listing: ListingRecord) => {
    const pictures = listing.pictures || [];
    const approvedPictures = pictures.filter((pic: any) => pic.status === 'approved');
    if (approvedPictures.length === 0) return null;

    const firstPic = approvedPictures[0];
    const mediaId = typeof firstPic.photo === 'string' ? firstPic.photo : firstPic.photo?.id;
    return mediaId ? payloadClient.getFileUrl(mediaId) : null;
  }, []);

  // Helper function to calculate rating from reviews
  const calculateRating = useCallback((reviews: any[]) => {
    if (!reviews || reviews.length === 0) return null;
    const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    return Number((totalRating / reviews.length).toFixed(1));
  }, []);

  // ============ CLIENT-SIDE FILTERING (FAST & STABLE) ============
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

    // 4. Filter by facilities
    if (selectedFacilities.length > 0) {
      filtered = filtered.filter((l) => {
        const lf = l.facilities?.facilities?.map((f) => f.facility) || [];
        return selectedFacilities.every((f) => lf.some((facility) => facility === f));
      });
    }

    // 5. Filter by location features
    if (selectedLocationFeatures.length > 0) {
      filtered = filtered.filter((l) => {
        let matches = true;

        if (selectedLocationFeatures.includes('near_public_transport')) {
          const address = l.location?.address?.toLowerCase() || '';
          matches = matches && /\b(station|halte|metro|tram|bus|trein)\b/.test(address);
        }

        if (selectedLocationFeatures.includes('parking_available')) {
          const facilities = l.facilities?.facilities?.map((f) => f.facility) || [];
          matches = matches && facilities.some((f) => f === 'parking');
        }

        if (selectedLocationFeatures.includes('wheelchair_accessible')) {
          const facilities = l.facilities?.facilities?.map((f) => f.facility) || [];
          matches = matches && facilities.some((f) => f === 'wheelchair_accessible');
        }

        return matches;
      });
    }

    return filtered;
  }, [
    cachedListings,
    region,
    selectedCategories,
    debouncedSearchQuery,
    selectedFacilities,
    selectedLocationFeatures,
  ]);

  // Map markers - filter from cache, never empty
  const mapMarkers = useMemo(() => {
    return visibleListings.filter((l) => {
      const coords = l.location?.coordinates;
      return coords && coords.length >= 2;
    });
  }, [visibleListings]);

  // Convert listings to GeoJSON format for clustering
  const geoJsonPoints = useMemo(() => {
    return mapMarkers.map((listing) => {
      const coords = listing.location?.coordinates;
      if (!coords || coords.length < 2) return null;
      return {
        type: 'Feature' as const,
        properties: {
          id: listing.id,
          listing: listing,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [coords[0], coords[1]], // [longitude, latitude]
        },
      };
    }).filter((point): point is NonNullable<typeof point> => point !== null);
  }, [mapMarkers]);

  // Get map dimensions for clustering
  const mapDimensions = useMemo(() => {
    return {
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
    };
  }, []);

  // Convert latitudeDelta to zoom level for clustering
  // Formula: zoom = log2(360 / latitudeDelta)
  const regionWithZoom = useMemo(() => {
    const zoom = Math.round(Math.log2(360 / region.latitudeDelta));
    const clampedZoom = Math.max(0, Math.min(20, zoom));
    return {
      ...region,
      zoom: clampedZoom,
    };
  }, [region]);

  // Use clusterer hook - returns [points, supercluster instance]
  const [points, supercluster] = useClusterer(geoJsonPoints, mapDimensions, regionWithZoom);



  const hasActiveFilters =
    selectedCategories.length > 0 || searchQuery.trim().length > 0;

  // Handlers
  const animateToRegion = useCallback((nextRegion: Region) => {
    mapRef.current?.animateToRegion(nextRegion, 500);
  }, []);

  const locateUser = useCallback(async () => {
    try {
      setRequestingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setRequestingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const nextRegion: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setRegion(nextRegion);
      animateToRegion(nextRegion);
    } catch (error) {
      console.warn('[SearchTab] Failed to locate user', error);
    } finally {
      setRequestingLocation(false);
    }
  }, [animateToRegion]);

  useEffect(() => {
    locateUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // NO debouncing - instant update, client-side filter handles it
  const handleRegionChangeComplete = useCallback((nextRegion: Region) => {
    setRegion(nextRegion);
  }, []);

  const handleSelectListing = useCallback(
    (listing: ListingRecord) => {
      const coords = listing.location?.coordinates;
      if (coords && coords.length >= 2) {
        setSelectedId(listing.id);
        animateToRegion({
          latitude: coords[1],
          longitude: coords[0],
          latitudeDelta: region.latitudeDelta,
          longitudeDelta: region.longitudeDelta,
        });
      }
    },
    [animateToRegion, region.latitudeDelta, region.longitudeDelta]
  );

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

  const resolveOwnerId = useCallback((listing: ListingRecord): string | null => {
    const { owner } = listing;
    if (!owner) return null;
    if (typeof owner === 'string') return owner;
    if (owner && typeof owner === 'object' && 'id' in owner) {
      return owner.id as string;
    }
    return null;
  }, []);

  const isListingOwner = useCallback(
    (listing: ListingRecord) => {
      if (!user) return false;
      const ownerId = resolveOwnerId(listing);
      return ownerId === user.id;
    },
    [user, resolveOwnerId]
  );

  const handleToggleFavorite = useCallback(
    (listingId: string, currentlyFavorite: boolean) => {
      toggleFavorite.mutate({ listingId, isFavorite: currentlyFavorite });
    },
    [toggleFavorite]
  );

  // Render cluster marker

  // Render card - stable callback
  const renderCard = useCallback(
    ({ item }: { item: ListingRecord }) => {
      const isFavorite = favoriteIds.has(item.id);
      const categoryName = getCategoryDisplayName(item.category);
      const categoryColor = getCategoryColor(item.category);
      const distance = typeof item.distance === 'number' ? item.distance : null;
      const imageUrl = getFirstImageUrl(item);
      const categoryIcon = getCategoryIcon(item.category || '');
      const reviews = (item as any).reviews || [];
      const averageRating = calculateRating(reviews);
      const reviewCount = reviews.length;

      return (
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.card, selectedId === item.id && styles.cardActive]}
          onPress={() => handleOpenDetailPage(item)}>
          {/* Image Thumbnail on Left */}
          <View style={styles.cardImageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
            ) : (
              <View style={[styles.cardImagePlaceholder, { backgroundColor: categoryColor + '20' }]}>
                <Ionicons name={categoryIcon as any} size={32} color={categoryColor} />
              </View>
            )}
            {/* Badge Overlay on Image */}
            <View style={styles.cardImageOverlay}>
              <View
                style={[
                  styles.categoryBadge,
                  {
                    backgroundColor: categoryColor + 'E6',
                    borderColor: categoryColor,
                  },
                ]}>
                <Text style={[styles.categoryBadgeText, { color: '#fff' }]}>{categoryName}</Text>
              </View>
            </View>
          </View>

          {/* Content on Right */}
          <View style={styles.cardContentRight}>
            {/* Rating, Popularity, and Favorite Row */}
            <View style={styles.cardRatingRow}>
              {averageRating !== null && (
                <View style={styles.ratingDisplay}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{averageRating}</Text>
                </View>
              )}
              {reviewCount > 0 && (
                <View style={styles.popularityDisplay}>
                  <Ionicons name="person" size={14} color="#6b7280" />
                  <Text style={styles.popularityText}>{reviewCount}</Text>
                </View>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                style={[
                  styles.cardFavoriteButton,
                  isFavorite && styles.cardFavoriteButtonActive,
                  { backgroundColor: isFavorite ? Colors.error : 'transparent' },
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(item.id, isFavorite);
                }}
                activeOpacity={0.7}>
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={16}
                  color={isFavorite ? '#fff' : Colors.error}
                />
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text numberOfLines={2} style={styles.cardTitle}>
              {item.name ?? 'Onbekende locatie'}
            </Text>

            {/* Address */}
            <Text numberOfLines={1} style={styles.cardAddress}>
              {item.location?.address ?? 'Adres onbekend'}
            </Text>

            {/* Metadata Row */}
            <View style={styles.cardMetaRow}>
              {distance !== null && distance < 100 && (
                <Text style={styles.distanceText}>
                  {distance < 1 ? '< 1km' : `${distance.toFixed(1)}km`}
                </Text>
              )}
            </View>

            {/* Product offerings voor relevante categorieën */}
            {['food', 'hygiene', 'community'].includes(item.category || '') && (
              <View style={styles.productActions}>
                <TouchableOpacity
                  style={styles.productButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleViewProducts(item);
                  }}>
                  <Ionicons name="basket-outline" size={14} color={Colors.primary} />
                  <Text style={styles.productButtonText}>Aanbod bekijken</Text>
                </TouchableOpacity>

                {isListingOwner(item) && (
                  <TouchableOpacity
                    style={[styles.productButton, styles.manageButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleManageProducts(item);
                    }}>
                    <Ionicons name="create-outline" size={14} color="#fff" />
                    <Text style={styles.manageButtonText}>Beheren</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [
      selectedId,
      favoriteIds,
      handleOpenDetailPage,
      handleToggleFavorite,
      handleViewProducts,
      handleManageProducts,
      isListingOwner,
      getCategoryDisplayName,
      getCategoryColor,
      getCategoryIcon,
      getFirstImageUrl,
      calculateRating,
    ]
  );

  // Compact empty card component
  const EmptyCard = () => (
    <View style={styles.emptyCard}>
      <Ionicons name="search-outline" size={32} color={Colors.primary} />
      <Text style={styles.emptyCardTitle}>Geen kasten gevonden</Text>
      <Text style={styles.emptyCardSubtitle}>
        {hasActiveFilters ? 'Probeer andere filters of zoom uit' : 'Zoom uit of verplaats de kaart'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        customMapStyle={paperMapStyle}
        showsUserLocation
        showsMyLocationButton={false}>
        {/* Render clustered markers */}
        {points.filter(p => p && p.properties && p.geometry).map((point: any, index: number) => {
          const { properties, geometry } = point;
          const { coordinates } = geometry;
          
          if (!coordinates || coordinates.length < 2) return null;
          
          const [longitude, latitude] = coordinates;
          
          // Check if it's a cluster
          if (isClusterFeature(point)) {
            const pointCount = properties.point_count || properties.pointCount || 0;
            const clusterId = properties.cluster_id;
            
            return (
              <Marker
                key={`cluster-${clusterId}-${index}`}
                coordinate={{ latitude, longitude }}
                pinColor="#8B5CF6"
                title={`${pointCount} locaties`}
                description="Tik om in te zoomen"
                onPress={() => {
                  if (supercluster && clusterId !== undefined) {
                    const expansionZoom = Math.min(
                      supercluster.getClusterExpansionZoom(clusterId),
                      20
                    );
                    const camera = {
                      center: { latitude, longitude },
                      zoom: expansionZoom,
                      heading: 0,
                      pitch: 0,
                      altitude: 0,
                    };
                    mapRef.current?.animateCamera(camera, { duration: 300 });
                  }
                }}
              />
            );
          } else {
            // Individual marker
            const listing = properties.listing as ListingRecord;
            if (!listing) return null;
            
            return (
              <StableMarker
                key={`marker-${listing.id}-${index}`}
                listing={listing}
                isSelected={selectedId === listing.id}
                onPress={() => handleSelectListing(listing)}
                getCategoryIcon={getCategoryIcon}
              />
            );
          }
        })}
      </MapView>

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
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Zoek minibiebs, voedselbanken..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, selectedCategories.length > 0 && styles.filterButtonActive]}
            onPress={() => setShowFilters(!showFilters)}>
            {selectedCategories.length === 0 ? (
              <>
                <Ionicons name="grid-outline" size={18} color={Colors.primary} />
                <Text style={styles.filterButtonText}>Type kast</Text>
              </>
            ) : (
              <View style={styles.filterButtonIcons}>
                {selectedCategories.slice(0, 3).map((category) => (
                  <View
                    key={category}
                    style={[
                      styles.filterButtonIcon,
                      { backgroundColor: getCategoryColor(category) + '20' },
                    ]}>
                    <Ionicons
                      name={getCategoryIcon(category) as any}
                      size={16}
                      color={getCategoryColor(category)}
                    />
                  </View>
                ))}
                {selectedCategories.length > 3 && (
                  <View style={styles.filterButtonBadge}>
                    <Text style={styles.filterButtonBadgeText}>+{selectedCategories.length - 3}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.locateButton}
            onPress={locateUser}
            disabled={requestingLocation}>
            <Ionicons
              name={requestingLocation ? 'time' : 'locate'}
              size={18}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Panel - Komoot style dropdown */}
      {showFilters && (
        <>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowFilters(false)}
          />
          <View
            style={[
              styles.filterPanel,
              {
                top: 64 + insets.top,
                left: 16 + insets.left,
              },
            ]}
            onStartShouldSetResponder={() => true}>
            <ScrollView style={styles.filterList} showsVerticalScrollIndicator={false}>
              {[
                { value: 'all', label: 'Alle kasten', icon: 'grid' },
                { value: 'book', label: 'Boekenkast', icon: 'library' },
                { value: 'food', label: 'Voedselkast', icon: 'storefront' },
                { value: 'hygiene', label: 'Hygiënekast', icon: 'medical' },
                { value: 'community', label: 'Gemeenschapskast', icon: 'restaurant' },
                { value: 'other', label: 'Anders', icon: 'ellipse-outline' },
              ].map((category) => {
                const isSelected = category.value === 'all'
                  ? selectedCategories.length === 0
                  : selectedCategories.includes(category.value);
                return (
                  <TouchableOpacity
                    key={category.value}
                    style={styles.filterListItem}
                    onPress={() => {
                      if (category.value === 'all') {
                        setSelectedCategories([]);
                      } else {
                        setSelectedCategories((prev) => {
                          if (prev.includes(category.value)) {
                            return prev.filter((c) => c !== category.value);
                          } else {
                            return [...prev, category.value];
                          }
                        });
                      }
                    }}>
                    <View style={styles.filterListItemLeft}>
                      <View
                        style={[
                          styles.filterListItemIcon,
                          { backgroundColor: isSelected ? getCategoryColor(category.value) : '#e5e7eb' },
                        ]}>
                        <Ionicons
                          name={category.icon as any}
                          size={18}
                          color={isSelected ? '#fff' : '#6b7280'}
                        />
                      </View>
                      <Text style={styles.filterListItemText}>{category.label}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={category.value === 'all' ? Colors.primary : getCategoryColor(category.value)}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </>
      )}

      {/* ALWAYS-MOUNTED FLATLIST (Critical for stability) */}
      <View style={[styles.bottomSheet, { paddingBottom: Math.max(24, insets.bottom + 16) }]}>
        {isInitialLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}

        <FlatList
          horizontal
          data={visibleListings}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          ListEmptyComponent={<EmptyCard />}
          contentContainerStyle={styles.cardList}
          showsHorizontalScrollIndicator={false}
          // Snap scrolling
          snapToInterval={CARD_WIDTH + 16}
          snapToAlignment="start"
          decelerationRate="fast"
          // Performance
          removeClippedSubviews={false} // Causes issues on Android
          windowSize={10}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={100}
          initialNumToRender={3}
          // Only re-render when data identity changes
          extraData={selectedId}
          getItemLayout={(data, index) => ({
            length: CARD_WIDTH + 16,
            offset: (CARD_WIDTH + 16) * index,
            index,
          })}
        />
      </View>

      {/* Product Offerings Modals */}
      {showProductViewer && selectedListingForProducts && (
        <View style={styles.modalOverlay}>
          <ProductOfferingsViewer
            listingId={selectedListingForProducts.id}
            listingName={selectedListingForProducts.name || 'Onbekende locatie'}
            isOwner={isListingOwner(selectedListingForProducts)}
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
    backgroundColor: Colors.light,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
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
    color: '#1f2937',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 100,
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#f9fafb',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
  filterButtonIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterButtonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  filterPanel: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 3,
    maxHeight: 300,
    width: 240,
    overflow: 'hidden',
  },
  filterList: {
    maxHeight: 300,
  },
  filterListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  filterListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterListItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  filterListItemText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  clearAllFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  clearAllFiltersText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  facilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  facilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  facilityChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  facilityChipText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  facilityChipTextSelected: {
    color: '#fff',
  },
  locateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 10,
  },
  cardList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 16,
    alignItems: 'flex-start',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardImageContainer: {
    width: 100,
    height: 100,
    position: 'relative',
    marginRight: 12,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  cardImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 6,
  },
  cardContentRight: {
    flex: 1,
    padding: 0,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  cardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  popularityDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  popularityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  cardContent: {
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardFavoriteButton: {
    padding: 4,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  cardFavoriteButtonActive: {
    backgroundColor: Colors.error,
  },
  cardAddress: {
    fontSize: 13,
    color: '#6b7280',
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  productButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 4,
  },
  productButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  manageButton: {
    backgroundColor: Colors.primary,
  },
  manageButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  distanceText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  marker: {
    // No background, border, or padding - just the icon
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Compact empty card
  emptyCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  emptyCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  emptyCardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
