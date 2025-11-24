import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
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
import { useListingsInBounds, LISTINGS_MAP_SELECT } from '~/lib/hooks/useLocationQueries';
import { useFavorites, useToggleFavorite } from '~/lib/hooks/usePayloadQuery';
import { useAuth } from '~/lib/providers/AuthProvider';
import { ListingRecord } from '~/lib/types/models';

const minibiebPlaceholder = require('~/assets/images/minibieb-placeholder.jpg');

const FALLBACK_REGION: Region = {
  latitude: 52.0907,
  longitude: 5.1214,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

const CARD_WIDTH = Dimensions.get('window').width * 0.86;
const CARD_HEIGHT = 140;
const CARD_SPACING = 16;
const CARD_TOTAL_WIDTH = CARD_WIDTH + CARD_SPACING;

// Margin multiplier for fetching listings outside visible viewport
// This ensures listings are preloaded before they become visible (no loading visible to user)
const FETCH_MARGIN_MULTIPLIER = 2.0; // Fetch 2x the visible area (100% margin on each side = 5x total area)

// Stable marker component to prevent blinking
const StableMarker = React.memo<{
  listing: ListingRecord;
  isSelected: boolean;
  onPress: () => void;
  getCategoryIcon: (category: string) => string;
  getCategoryIconLibrary: (category: string) => string;
  getCategoryColor: (category: string) => string;
}>(({ listing, isSelected, onPress, getCategoryIcon, getCategoryIconLibrary, getCategoryColor }) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    // Enable when selection changes to show updated icon color
    setTracksViewChanges(true);
    // Then disable after a short delay to prevent flickering during zoom
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [isSelected]); // Re-enable when selection changes

  const coords = listing.location?.coordinates;
  if (!coords || coords.length < 2) return null;

  const categoryIcon = getCategoryIcon(listing.category);
  const iconLibrary = getCategoryIconLibrary(listing.category || '');
  const categoryColor = getCategoryColor(listing.category || '');

  // Use category color
  const iconColor = categoryColor;

  return (
    <Marker
      coordinate={{ latitude: coords[1], longitude: coords[0] }}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}>
      <View style={styles.marker}>
        {isSelected ? (
          <View style={[styles.markerSelectedCircle, { borderColor: categoryColor }]}>
            {iconLibrary === 'FontAwesome5' ? (
              <FontAwesome5 name={categoryIcon as any} size={24} color={iconColor} solid />
            ) : (
              <Ionicons name={categoryIcon as any} size={24} color={iconColor} />
            )}
          </View>
        ) : (
          <>
            {iconLibrary === 'FontAwesome5' ? (
              <FontAwesome5 name={categoryIcon as any} size={24} color={iconColor} solid />
            ) : (
              <Ionicons name={categoryIcon as any} size={24} color={iconColor} />
            )}
          </>
        )}
      </View>
    </Marker>
  );
}, (prevProps, nextProps) => {
  // Re-render when selection state changes
  return (
    prevProps.listing.id === nextProps.listing.id &&
    prevProps.isSelected === nextProps.isSelected
  );
});

const ClusterMarker = React.memo<{
  latitude: number;
  longitude: number;
  pointCount: number;
  onPress: () => void;
}>(({ latitude, longitude, pointCount, onPress }) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    // Enable initially to render, then disable to prevent flickering
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}>
      <View style={styles.marker}>
        <View
          style={{
            backgroundColor: '#8B5CF6',
            borderRadius: 16,
            paddingHorizontal: 10,
            paddingVertical: 6,
            minWidth: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: '#FFFFFF',
          }}>
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>
            {pointCount}
          </Text>
        </View>
      </View>
    </Marker>
  );
});

export default function SearchTab() {
  const mapRef = useRef<MapView>(null);
  const carouselRef = useRef<FlatList>(null);
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
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [viewableItemIndex, setViewableItemIndex] = useState<number>(0);


  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
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

  // Track last fetched bounds (to avoid refetching overlapping areas)
  const lastFetchedBounds = useRef<{
    northEast: { lat: number; lon: number };
    southWest: { lat: number; lon: number };
  } | null>(null);

  // Calculate bounds for fetching - use larger area with margin to preload listings
  // outside visible viewport to prevent visible loading when user pans/zooms
  const currentBounds = useMemo(() => {
    // Add margin: fetch listings from a larger area than visible
    // This ensures listings are already loaded before they become visible on screen
    const latHalf = (region.latitudeDelta / 2) * (1 + FETCH_MARGIN_MULTIPLIER * 2);
    const lonHalf = (region.longitudeDelta / 2) * (1 + FETCH_MARGIN_MULTIPLIER * 2);

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
    select: LISTINGS_MAP_SELECT, // Only fetch necessary fields
  });

  // Helper function to check if current bounds overlap enough with fetched bounds
  const boundsOverlapEnough = useCallback(
    (
      current: { northEast: { lat: number; lon: number }; southWest: { lat: number; lon: number } },
      fetched: { northEast: { lat: number; lon: number }; southWest: { lat: number; lon: number } }
    ): boolean => {
      // Check if current bounds are fully contained within fetched bounds
      const isFullyContained =
        current.southWest.lat >= fetched.southWest.lat &&
        current.northEast.lat <= fetched.northEast.lat &&
        current.southWest.lon >= fetched.southWest.lon &&
        current.northEast.lon <= fetched.northEast.lon;

      if (isFullyContained) return true;

      // Calculate overlap area (simplified: check if centers are close and areas overlap)
      // If more than 50% of current bounds area is outside fetched bounds, we need to fetch
      const currentLatSpan = current.northEast.lat - current.southWest.lat;
      const currentLonSpan = current.northEast.lon - current.southWest.lon;
      const currentArea = currentLatSpan * currentLonSpan;

      // Calculate overlapping bounds
      const overlapSouthWest = {
        lat: Math.max(current.southWest.lat, fetched.southWest.lat),
        lon: Math.max(current.southWest.lon, fetched.southWest.lon),
      };
      const overlapNorthEast = {
        lat: Math.min(current.northEast.lat, fetched.northEast.lat),
        lon: Math.min(current.northEast.lon, fetched.northEast.lon),
      };

      // Check if there's any overlap
      if (
        overlapSouthWest.lat >= overlapNorthEast.lat ||
        overlapSouthWest.lon >= overlapNorthEast.lon
      ) {
        return false; // No overlap at all
      }

      const overlapLatSpan = overlapNorthEast.lat - overlapSouthWest.lat;
      const overlapLonSpan = overlapNorthEast.lon - overlapSouthWest.lon;
      const overlapArea = overlapLatSpan * overlapLonSpan;

      // If overlap covers less than 50% of current bounds, we need to fetch
      return overlapArea / currentArea >= 0.5;
    },
    []
  );

  // Fetch when bounds change and don't overlap enough with previously fetched bounds
  useEffect(() => {
    const shouldFetch = () => {
      // Always fetch if we have no listings
      if (cachedListings.length === 0) return true;

      // Always fetch if we haven't fetched before
      if (!lastFetchedBounds.current) return true;

      // Check if current bounds overlap enough with fetched bounds
      return !boundsOverlapEnough(currentBounds, lastFetchedBounds.current);
    };

    if (shouldFetch()) {
      setIsInitialLoading(true);
      fetchListings()
        .then((result) => {
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
            // Update fetched bounds
            lastFetchedBounds.current = {
              northEast: { ...currentBounds.northEast },
              southWest: { ...currentBounds.southWest },
            };
          }
        })
        .catch((error) => {
          console.error('Error fetching listings:', error);
        })
        .finally(() => {
          setIsInitialLoading(false);
        });
    }
  }, [currentBounds, cachedListings.length, boundsOverlapEnough, fetchListings]); // eslint-disable-line react-hooks/exhaustive-deps

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
        return 'book';
      case 'food':
        return 'store';
      case 'hygiene':
        return 'pump-medical';
      case 'community':
        return 'utensils';
      default:
        return 'pin';
    }
  }, []);
  
  // Get icon library for category (FontAwesome for specific categories, Ionicons for others)
  const getCategoryIconLibrary = useCallback((category: string) => {
    switch (category) {
      case 'book':
      case 'food':
      case 'hygiene':
      case 'community':
        return 'FontAwesome5';
      default:
        return 'Ionicons';
    }
  }, []);

  const getCategoryColor = useCallback((category: string) => {
    switch (category) {
      case 'book':
        return '#a27070';
      case 'food':
        return '#ab947c';
      case 'hygiene':
        return '#b6ac8f';
      case 'community':
        return '#9bb393';
      case 'other':
        return '#a0b9be';
      default:
        return '#a0b9be';
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


  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

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

    // 4. Filter by location features (facilities filtering removed)
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
  }, [
    cachedListings,
    region,
    selectedCategories,
    debouncedSearchQuery,
    selectedLocationFeatures,
  ]);

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

    // 3. Filter by location features (facilities filtering removed)
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
  }, [
    cachedListings,
    selectedCategories,
    debouncedSearchQuery,
    selectedLocationFeatures,
  ]);

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
  const [points, supercluster] = useClusterer(geoJsonPoints, mapDimensions, regionWithZoom,   {
    radius: 30,        // Cluster radius in pixels (larger = fewer clusters, smaller = more clusters)
    minPoints: 2,      // Minimum points to form a cluster
    maxZoom: 9,       // Max zoom level where clustering occurs (after this, show individual markers)
    minZoom: 0,        // Min zoom level where clustering occurs
  });



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
      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      const nextRegion: Region = {
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setUserLocation(userCoords);
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
    // Update region immediately for instant filtering
    setRegion(nextRegion);
  }, []);

  // Store visibleListings in a ref to access latest value in callbacks
  const visibleListingsRef = useRef(visibleListings);
  useEffect(() => {
    visibleListingsRef.current = visibleListings;
  }, [visibleListings]);

  const handleSelectListing = useCallback(
    (listing: ListingRecord) => {
      // Update selection
      setSelectedId(listing.id);
      
      // Scroll carousel to the selected listing only if it's visible
      // Small delay to ensure FlatList is ready and check latest data
      setTimeout(() => {
        const currentVisible = visibleListingsRef.current;
        if (carouselRef.current && currentVisible.length > 0) {
          const index = currentVisible.findIndex((l) => l.id === listing.id);
          // Only scroll if listing is actually in visibleListings and index is valid
          if (index !== -1 && index < currentVisible.length) {
            try {
              carouselRef.current.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0.5, // Center the item
              });
            } catch (error) {
              // Silently fail if scroll fails (list might have changed)
              console.warn('[SearchTab] Failed to scroll to listing:', error);
            }
          }
        }
      }, 150);
    },
    [] // No dependencies - use ref to access latest visibleListings
  );

  // Handle carousel swipe - update selected listing (no automatic zooming)
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ item: any; index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].item.id !== 'empty') {
        const item = viewableItems[0].item as ListingRecord;
        const index = viewableItems[0].index || 0;
        
        if (index !== viewableItemIndex || selectedId !== item.id) {
          // Update selected ID for visual feedback on marker
          setSelectedId(item.id);
          setViewableItemIndex(index);
        }
      }
    },
    [viewableItemIndex, selectedId]
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
      
      // Calculate distance from user location
      let distance: number | null = typeof item.distance === 'number' ? item.distance : null;
      if (!distance && userLocation && item.location?.coordinates) {
        const [lon, lat] = item.location.coordinates;
        distance = calculateDistance(userLocation.latitude, userLocation.longitude, lat, lon);
      }
      
      const imageUrl = getFirstImageUrl(item);

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
              <Image source={minibiebPlaceholder} style={styles.cardImage} resizeMode="cover" />
            )}
            {/* Category Badge at Top Left */}
            <View style={styles.cardImageBadge}>
              <View
                style={[
                  styles.categoryBadge,
                  {
                    backgroundColor: categoryColor,
                  },
                ]}>
                <Text style={styles.categoryBadgeText}>{categoryName}</Text>
              </View>
            </View>
          </View>

          {/* Content on Right */}
          <View style={styles.cardContentRight}>
            {/* Favorite Button Row */}
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                style={styles.cardFavoriteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(item.id, isFavorite);
                }}
                activeOpacity={0.7}>
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavorite ? Colors.error : '#9ca3af'}
                />
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text numberOfLines={2} style={styles.cardTitle}>
              {item.name ?? 'Onbekende locatie'}
            </Text>

            {/* Details Row - Komoot style */}
            <View style={styles.cardDetailsRow}>
              {distance !== null && (
                <>
                  <Ionicons name="location" size={14} color="#6b7280" />
                  <Text style={styles.cardDetailText}>
                    {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
                  </Text>
                </>
              )}
              {distance !== null && item.location?.address && (
                <Text style={styles.cardDetailSeparator}> • </Text>
              )}
              {item.location?.address && (
                <Text numberOfLines={1} style={styles.cardDetailText}>
                  {item.location.address.split(',')[0]}
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
      userLocation,
      calculateDistance,
    ]
  );

  // Empty state card - displayed as first card in carousel
  const renderEmptyCard = useCallback(() => {
    return (
      <TouchableOpacity
        activeOpacity={1}
        style={[styles.card, styles.emptyStateCard]}
        disabled>
        <View style={styles.emptyCardContent}>
          <Ionicons name="search-outline" size={32} color={Colors.primary} />
          <Text style={styles.emptyCardTitle}>Geen kasten gevonden</Text>
          <Text style={styles.emptyCardSubtitle}>
            {hasActiveFilters ? 'Probeer andere filters of zoom uit' : 'Zoom uit of verplaats de kaart'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [hasActiveFilters]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        customMapStyle={paperMapStyle}
        showsUserLocation
        showsMyLocationButton={false}
        moveOnMarkerPress={false}>
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
              <ClusterMarker
                key={`cluster-${clusterId}-${index}`}
                latitude={latitude}
                longitude={longitude}
                pointCount={pointCount}
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
                key={`marker-${listing.id}-${selectedId === listing.id ? 'selected' : 'unselected'}`}
                listing={listing}
                isSelected={selectedId === listing.id}
                onPress={() => handleSelectListing(listing)}
                getCategoryIcon={getCategoryIcon}
                getCategoryIconLibrary={getCategoryIconLibrary}
                getCategoryColor={getCategoryColor}
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
                    {getCategoryIconLibrary(category) === 'FontAwesome5' ? (
                      <FontAwesome5
                        name={getCategoryIcon(category) as any}
                        size={16}
                        color={getCategoryColor(category)}
                        solid
                      />
                    ) : (
                      <Ionicons
                        name={getCategoryIcon(category) as any}
                        size={16}
                        color={getCategoryColor(category)}
                      />
                    )}
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
                { value: 'book', label: 'Boekenkast' },
                { value: 'food', label: 'Voedselkast' },
                { value: 'hygiene', label: 'Hygiënekast' },
                { value: 'community', label: 'Gemeenschapskast' },
                { value: 'other', label: 'Anders' },
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
                        {category.value === 'all' ? (
                          <Ionicons
                            name={'grid' as any}
                            size={18}
                            color={isSelected ? '#fff' : '#6b7280'}
                          />
                        ) : getCategoryIconLibrary(category.value) === 'FontAwesome5' ? (
                          <FontAwesome5
                            name={getCategoryIcon(category.value) as any}
                            size={18}
                            color={isSelected ? '#fff' : getCategoryColor(category.value)}
                            solid={isSelected}
                          />
                        ) : (
                          <Ionicons
                            name={getCategoryIcon(category.value) as any}
                            size={18}
                            color={isSelected ? '#fff' : '#6b7280'}
                          />
                        )}
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
          ref={carouselRef}
          horizontal
          data={visibleListings.length === 0 ? [{ id: 'empty' }] : visibleListings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => 
            item.id === 'empty' ? renderEmptyCard() : renderCard({ item })
          }
          contentContainerStyle={styles.cardList}
          showsHorizontalScrollIndicator={false}
          // Snap scrolling - center cards
          snapToInterval={CARD_TOTAL_WIDTH}
          snapToAlignment="start"
          decelerationRate="fast"
          // Track visible item to zoom map
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 50,
          }}
          // Performance
          removeClippedSubviews={false} // Causes issues on Android
          windowSize={10}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={100}
          initialNumToRender={3}
          // Only re-render when data identity changes
          extraData={selectedId}
          onScrollToIndexFailed={(info) => {
            // Handle scroll failure gracefully - check bounds before retry
            const wait = new Promise((resolve) => setTimeout(resolve, 500));
            wait.then(() => {
              if (carouselRef.current && info.index !== undefined) {
                const currentData = visibleListings.length === 0 ? [{ id: 'empty' }] : visibleListings;
                // Only retry if index is within bounds
                if (info.index >= 0 && info.index < currentData.length) {
                  try {
                    carouselRef.current.scrollToIndex({
                      index: info.index,
                      animated: true,
                      viewPosition: 0.5,
                    });
                  } catch (error) {
                    // Silently fail if scroll still fails
                    console.warn('[SearchTab] Scroll retry failed:', error);
                  }
                }
              }
            });
          }}
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
    paddingLeft: (Dimensions.get('window').width - CARD_WIDTH) / 2,
    paddingRight: (Dimensions.get('window').width - CARD_WIDTH) / 2,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'flex-start',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    marginRight: CARD_SPACING,
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
    width: 120,
    height: CARD_HEIGHT,
    position: 'relative',
    flexShrink: 0,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: 114,
    height: 128,
    borderRadius: 16,
  },
  cardImageBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
  },
  cardContentRight: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  cardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 20,
    marginBottom: 4,
  },
  cardFavoriteButton: {
    padding: 4,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  cardDetailText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  cardDetailSeparator: {
    fontSize: 13,
    color: '#9ca3af',
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
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  marker: {
    // No background, border, or padding - just the icon
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerSelectedCircle: { // TODO FIX later
    width: 44,
    height: 44,
    // borderRadius: 22,
    // borderWidth: 3,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.25,
    // shadowRadius: 3,
    // elevation: 5,
  },
  emptyStateCard: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
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
    lineHeight: 20,
  },
});

