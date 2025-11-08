import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import Colors from '~/constants/Colors';
import { useListings, useFavorites, useToggleFavorite } from '~/lib/hooks/usePayloadQuery';
import { ListingRecord } from '~/lib/types/models';

const FALLBACK_REGION: Region = {
  latitude: 52.0907,
  longitude: 5.1214,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

const CARD_WIDTH = Dimensions.get('window').width * 0.86;

export default function SearchTab() {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(FALLBACK_REGION);
  const [hasCenteredMap, setHasCenteredMap] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);

  const { data: listings = [], isLoading, isError } = useListings();
  const { data: favorites = [] } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  const favoriteIds = useMemo(() => {
    const ids = new Set<string>();
    favorites.forEach((favorite: any) => {
      const favId =
        typeof favorite.listing === 'string'
          ? favorite.listing
          : favorite.listing?.id ?? favorite.listing_id;
      if (favId) {
        ids.add(favId);
      }
    });
    return ids;
  }, [favorites]);

  const listingsInRegion = useMemo(() => {
    if (!region || !listings?.length) {
      return listings ?? [];
    }

    const latHalf = region.latitudeDelta / 2;
    const lonHalf = region.longitudeDelta / 2;
    const minLat = region.latitude - latHalf;
    const maxLat = region.latitude + latHalf;
    const minLon = region.longitude - lonHalf;
    const maxLon = region.longitude + lonHalf;

    return listings.filter((listing: ListingRecord) => {
      const coords = listing.location?.coordinates;
      if (!coords || coords.length < 2) {
        return false;
      }
      const [lon, lat] = coords;
      return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
    });
  }, [region, listings]);

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
      setHasCenteredMap(true);
      animateToRegion(nextRegion);
    } catch (error) {
      console.warn('[SearchTab] Failed to locate user', error);
    } finally {
      setRequestingLocation(false);
    }
  }, [animateToRegion]);

  useEffect(() => {
    if (!hasCenteredMap) {
      locateUser();
    }
  }, [hasCenteredMap, locateUser]);

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

  const handleToggleFavorite = useCallback(
    (listingId: string, currentlyFavorite: boolean) => {
      toggleFavorite.mutate({ listingId, isFavorite: currentlyFavorite });
    },
    [toggleFavorite]
  );

  const renderMarker = useCallback(
    (listing: ListingRecord) => {
      const coords = listing.location?.coordinates;
      if (!coords || coords.length < 2) {
        return null;
      }

      return (
        <Marker
          key={listing.id}
          coordinate={{ latitude: coords[1], longitude: coords[0] }}
          onPress={() => handleSelectListing(listing)}>
          <View style={[styles.marker, selectedId === listing.id && styles.markerActive]}>
            <Ionicons
              name="library-outline"
              size={12}
              color={selectedId === listing.id ? Colors.primary : Colors.light}
            />
          </View>
        </Marker>
      );
    },
    [selectedId, handleSelectListing]
  );

  const renderCard = ({ item }: { item: ListingRecord }) => {
    const coords = item.location?.coordinates;
    const isFavorite = favoriteIds.has(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.card, selectedId === item.id && styles.cardActive]}
        onPress={() => handleSelectListing(item)}>
        <View style={styles.cardHeader}>
          <Text numberOfLines={2} style={styles.cardTitle}>
            {item.name ?? 'Onbekende listing'}
          </Text>
          <TouchableOpacity
            style={styles.cardFavoriteButton}
            onPress={() => handleToggleFavorite(item.id, isFavorite)}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
        <Text numberOfLines={1} style={styles.cardAddress}>
          {item.location?.address ?? 'Adres onbekend'}
        </Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardMeta}>ID: {item.id}</Text>
          {coords && (
            <Text style={styles.cardMeta}>
              {coords[1].toFixed(3)}, {coords[0].toFixed(3)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}>
        {listingsInRegion.map(renderMarker)}
      </MapView>

      <View style={styles.topControls}>
        <TouchableOpacity
          style={styles.locateButton}
          onPress={locateUser}
          disabled={requestingLocation}>
          <Ionicons
            name={requestingLocation ? 'time' : 'locate'}
            size={18}
            color={Colors.white}
          />
          <Text style={styles.locateText}>
            {requestingLocation ? 'Zoeken…' : 'Mijn locatie'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSheet}>
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Listings laden…</Text>
          </View>
        ) : isError ? (
          <View style={styles.errorState}>
            <Ionicons name="warning" size={20} color="#b91c1c" />
            <Text style={styles.errorText}>Kon listings niet ophalen. Probeer het later opnieuw.</Text>
          </View>
        ) : listingsInRegion.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={24} color="#64748b" />
            <Text style={styles.emptyTitle}>Geen listings in dit gebied</Text>
            <Text style={styles.emptySubtitle}>Verplaats de kaart of zoom uit voor meer resultaten.</Text>
          </View>
        ) : (
          <FlatList
            horizontal
            data={listingsInRegion}
            renderItem={renderCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.cardList}
            showsHorizontalScrollIndicator={false}
            extraData={favoriteIds}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light,
  },
  topControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    left: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  locateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  locateText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 24,
  },
  loadingState: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#475569',
  },
  errorState: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  errorText: {
    textAlign: 'center',
    color: '#991b1b',
  },
  emptyState: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#4b5563',
  },
  cardList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardActive: {
    borderColor: Colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    paddingRight: 12,
  },
  cardFavoriteButton: {
    padding: 4,
  },
  cardAddress: {
    fontSize: 13,
    color: '#4b5563',
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  marker: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.light,
  },
  markerActive: {
    backgroundColor: Colors.light,
    borderColor: Colors.primary,
  },
});


