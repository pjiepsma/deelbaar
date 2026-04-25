import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Mapbox from '@rnmapbox/maps';
import { Button, Card, Chip, SearchField, Skeleton } from 'heroui-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchLiveListings } from '../../../lib/api/listings/fetchLiveListings';
import {
  CARD_CORNER_RADIUS,
  CARD_IMAGE_HEIGHT,
  CARD_OVERLAY_BUTTON_SIZE,
  CARD_SCROLL_GAP,
  CARD_WIDTH,
  CATEGORY_SCROLL_GAP,
  MAP_CATEGORY_FILTERS,
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_OVERLAY_BOTTOM_GAP,
  MAP_OVERLAY_HORIZONTAL_PADDING,
  MAP_OVERLAY_TOP_GAP,
  RATING_DOT_COUNT,
  RATING_DOT_SIZE,
} from './map.constants';
import { mapPayloadListingsToMapCards } from './mapListing.mapper';
import type { MapListingCard } from './map.types';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '');

const PAYLOAD_SERVER_ORIGIN = process.env.EXPO_PUBLIC_PAYLOAD_SERVER_URL;

export function MapScreen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<(typeof MAP_CATEGORY_FILTERS)[number]['value']>('All');
  const [listings, setListings] = useState<MapListingCard[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const loadListings = useCallback(async () => {
    if (!PAYLOAD_SERVER_ORIGIN) {
      setFetchError('Missing EXPO_PUBLIC_PAYLOAD_SERVER_URL');
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    setFetchError(null);
    try {
      const docs = await fetchLiveListings();
      setListings(mapPayloadListingsToMapCards(docs, PAYLOAD_SERVER_ORIGIN));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load listings';
      setFetchError(message);
      setListings([]);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const categoryMatch = category === 'All' || item.categorySlug === category;
      const searchTerm = search.trim().toLowerCase();
      const searchMatch = item.title.toLowerCase().includes(searchTerm);
      return categoryMatch && searchMatch;
    });
  }, [category, listings, search]);

  const listingsToRender: Array<MapListingCard | Record<string, never>> =
    isFetching && filteredListings.length === 0
      ? [{}, {}, {}]
      : filteredListings.length > 0
        ? filteredListings
        : [{}];

  const showMetaSkeleton = isFetching;
  const showRatingDetail = (listing: MapListingCard) =>
    listing.rating !== undefined && listing.reviews !== undefined;

  return (
    <View style={{ flex: 1 }}>
      <Mapbox.MapView
        style={{ flex: 1 }}
        compassEnabled={false}
        scaleBarEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Mapbox.Camera zoomLevel={MAP_DEFAULT_ZOOM} centerCoordinate={MAP_CENTER} />
      </Mapbox.MapView>

      <View
        style={{
          position: 'absolute',
          top: insets.top + MAP_OVERLAY_TOP_GAP,
          left: MAP_OVERLAY_HORIZONTAL_PADDING,
          right: MAP_OVERLAY_HORIZONTAL_PADDING,
          gap: 10,
        }}
      >
        <SearchField value={search} onChange={setSearch}>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search listings" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: CATEGORY_SCROLL_GAP, paddingRight: CATEGORY_SCROLL_GAP }}>
            {MAP_CATEGORY_FILTERS.map((item) => {
              const selected = item.value === category;
              return (
                <Chip
                  key={item.value}
                  variant={selected ? 'primary' : 'secondary'}
                  onPress={() => setCategory(item.value)}
                >
                  <Chip.Label>{item.label}</Chip.Label>
                </Chip>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View
        style={{
          position: 'absolute',
          left: MAP_OVERLAY_HORIZONTAL_PADDING,
          right: MAP_OVERLAY_HORIZONTAL_PADDING,
          bottom: tabBarHeight + MAP_OVERLAY_BOTTOM_GAP,
          gap: 8,
        }}
      >
        {fetchError ? (
          <Card>
            <Card.Body>
              <Card.Title>Listings unavailable</Card.Title>
              <Card.Description>{fetchError}</Card.Description>
            </Card.Body>
          </Card>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            {isFetching ? '…' : filteredListings.length} listing{filteredListings.length === 1 ? '' : 's'}
          </Text>
          <Text style={{ color: '#fff' }}>From Payload</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: CARD_SCROLL_GAP, paddingRight: CARD_SCROLL_GAP }}>
            {listingsToRender.map((item, index) => {
              const listing = item as MapListingCard;
              return (
                <Card
                  key={listing.id ?? `placeholder-${index}`}
                  style={{
                    width: CARD_WIDTH,
                    overflow: 'hidden',
                    borderRadius: CARD_CORNER_RADIUS,
                  }}
                >
                  <Skeleton isLoading={!listing.imageUrl} className="h-40 w-full rounded-none" variant="pulse">
                    <View style={{ position: 'relative' }}>
                      {listing.imageUrl ? (
                        <Image
                          source={{ uri: listing.imageUrl }}
                          style={{ width: '100%', height: CARD_IMAGE_HEIGHT }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={{ width: '100%', height: CARD_IMAGE_HEIGHT, backgroundColor: '#d1d5db' }} />
                      )}
                      <View
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: 12,
                        }}
                      >
                        <Button
                          size="sm"
                          variant="secondary"
                          style={{
                            width: CARD_OVERLAY_BUTTON_SIZE,
                            height: CARD_OVERLAY_BUTTON_SIZE,
                            borderRadius: CARD_OVERLAY_BUTTON_SIZE / 2,
                          }}
                        >
                          <Button.Label>
                            {listing.loved ? (
                              <Ionicons name="heart" size={16} color="#111827" />
                            ) : (
                              <Ionicons name="heart-outline" size={16} color="#111827" />
                            )}
                          </Button.Label>
                        </Button>
                      </View>
                      <View
                        style={{
                          position: 'absolute',
                          right: 56,
                          top: 12,
                        }}
                      >
                        <Button
                          size="sm"
                          variant="secondary"
                          style={{
                            width: CARD_OVERLAY_BUTTON_SIZE,
                            height: CARD_OVERLAY_BUTTON_SIZE,
                            borderRadius: CARD_OVERLAY_BUTTON_SIZE / 2,
                          }}
                        >
                          <Button.Label>
                            <Ionicons name="close" size={16} color="#111827" />
                          </Button.Label>
                        </Button>
                      </View>
                    </View>
                  </Skeleton>

                  <Card.Body>
                    <Skeleton isLoading={!listing.title} className="mt-2 h-5 w-48 rounded-md" variant="pulse">
                      <Card.Title>{listing.title ?? ''}</Card.Title>
                    </Skeleton>
                    {showMetaSkeleton ? (
                      <Skeleton className="mt-2 h-4 w-64 rounded-md" isLoading variant="pulse">
                        <Card.Description> </Card.Description>
                      </Skeleton>
                    ) : showRatingDetail(listing) ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                        <Card.Description>{listing.rating?.toFixed(1)}</Card.Description>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          {Array.from({ length: RATING_DOT_COUNT }).map((_, dotIndex) => {
                            const score = listing.rating ?? 0;
                            const filled = dotIndex < Math.round(score);
                            return (
                              <View
                                key={`${listing.id}-dot-${dotIndex}`}
                                style={{
                                  width: RATING_DOT_SIZE,
                                  height: RATING_DOT_SIZE,
                                  borderRadius: RATING_DOT_SIZE / 2,
                                  backgroundColor: filled ? '#16a34a' : '#bbf7d0',
                                }}
                              />
                            );
                          })}
                        </View>
                        <Card.Description>({listing.reviews})</Card.Description>
                        <Card.Description>•</Card.Description>
                        <Card.Description>{listing.distanceKm?.toFixed(1)} km away</Card.Description>
                      </View>
                    ) : listing.distanceKm !== undefined ? (
                      <Card.Description style={{ marginTop: 8 }}>
                        {listing.distanceKm.toFixed(1)} km from map center
                      </Card.Description>
                    ) : null}
                    <Skeleton isLoading={!listing.categoryLabel} className="mt-2 h-3 w-24 rounded-md" variant="pulse">
                      <Card.Description>{listing.categoryLabel ?? ''}</Card.Description>
                    </Skeleton>
                  </Card.Body>
                </Card>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
