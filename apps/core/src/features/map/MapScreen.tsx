import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import Mapbox from '@rnmapbox/maps';
import { Button, Card, Chip, SearchField, Skeleton, useThemeColor } from 'heroui-native';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../context/AuthContext';
import { useDiscoveryArea } from '../../context/DiscoveryAreaContext';
import { useLocale } from '../../context/LocaleContext';
import { useThemePreference } from '../../context/ThemePreferenceContext';
import { navigateToAuthModal } from '../../navigation/rootNavigation';
import { fetchLiveListings } from '../../lib/api/listings/fetchLiveListings';
import { MAP_PLACE_FILTERS } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import {
  CARD_CORNER_RADIUS,
  CARD_IMAGE_HEIGHT,
  CARD_OVERLAY_BUTTON_SIZE,
  CARD_SCROLL_GAP,
  CARD_WIDTH,
  CATEGORY_SCROLL_GAP,
  MAPBOX_STYLE_DARK,
  MAPBOX_STYLE_STREETS,
  MAP_CAMERA_DEBOUNCE_MS,
  MAP_CENTER,
  MAP_COACHMARK_OVERLAY_EXTRA_GAP,
  MAP_DEFAULT_ZOOM,
  MAP_OVERLAY_BOTTOM_GAP,
  MAP_OVERLAY_CHROME_TEXT_COLOR,
  MAP_OVERLAY_HORIZONTAL_PADDING,
  MAP_OVERLAY_TOP_GAP,
  RATING_DOT_COUNT,
  RATING_DOT_SIZE,
} from './map.constants';
import {
  getMapCoachmarkActivationDone,
  getMapCoachmarkCardsDone,
  getMapCoachmarkExploreDone,
  setMapCoachmarkActivationDone,
  setMapCoachmarkCardsDone,
  setMapCoachmarkExploreDone,
} from '../onboarding/mapCoachmarks.storage';
import { mapPayloadListingsToMapCards } from './mapListing.mapper';
import { ListingPreviewSheet } from './ListingPreviewSheet';
import {
  isMapListingCard,
  type MapListingCard,
  type MapListingCardPlaceholder,
  type MapPlaceRecord,
} from './map.types';

const PAYLOAD_SERVER_ORIGIN = process.env.EXPO_PUBLIC_PAYLOAD_SERVER_URL;

type CameraChangedPayload = {
  properties?: {
    center?: number[];
  };
};

export function MapScreen() {
  const navigation = useNavigation() as NavigationProp<ParamListBase>;
  const { user } = useAuth();
  const [previewPlace, setPreviewPlace] = useState<MapPlaceRecord | null>(null);
  const [listingCardIconColor, ratingFilledColor, ratingTrackColor, listingImagePlaceholderBg] = useThemeColor([
    'foreground',
    'success',
    'default',
    'muted',
  ]);
  const [search, setSearch] = useState('');
  const [listingTypeFilter, setListingTypeFilter] = useState<
    (typeof MAP_PLACE_FILTERS)[number]['value']
  >('All');
  const [rawListings, setRawListings] = useState<MapPlaceRecord[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { referenceLngLat, setReferenceLngLat } = useDiscoveryArea();
  const { resolvedScheme } = useThemePreference();
  const cameraDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapboxAccessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useLayoutEffect(() => {
    if (!mapboxAccessToken) {
      return;
    }
    Mapbox.setAccessToken(mapboxAccessToken);
  }, [mapboxAccessToken]);

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
      setRawListings(docs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load listings';
      setFetchError(message);
      setRawListings([]);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  const listings = useMemo(() => {
    if (!PAYLOAD_SERVER_ORIGIN) {
      return [];
    }
    return mapPayloadListingsToMapCards(rawListings, PAYLOAD_SERVER_ORIGIN, referenceLngLat);
  }, [rawListings, referenceLngLat]);

  const onCameraChanged = useCallback(
    (event: CameraChangedPayload) => {
      const center = event.properties?.center;
      if (!Array.isArray(center) || center.length < 2) {
        return;
      }
      const lng = center[0];
      const lat = center[1];
      if (typeof lng !== 'number' || typeof lat !== 'number' || Number.isNaN(lng) || Number.isNaN(lat)) {
        return;
      }
      if (cameraDebounceRef.current) {
        clearTimeout(cameraDebounceRef.current);
      }
      cameraDebounceRef.current = setTimeout(() => {
        setReferenceLngLat([lng, lat]);
      }, MAP_CAMERA_DEBOUNCE_MS);
    },
    [setReferenceLngLat],
  );

  useEffect(() => {
    return () => {
      if (cameraDebounceRef.current) {
        clearTimeout(cameraDebounceRef.current);
      }
    };
  }, []);

  const { t } = useLocale();
  const activationPromptedRef = useRef(false);
  const [coachReady, setCoachReady] = useState(false);
  const [coachPhase, setCoachPhase] = useState<'explore' | 'cards' | 'done'>('done');
  const [activationVisible, setActivationVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [exploreDone, cardsDone] = await Promise.all([
        getMapCoachmarkExploreDone(),
        getMapCoachmarkCardsDone(),
      ]);
      if (cancelled) {
        return;
      }
      if (!exploreDone) {
        setCoachPhase('explore');
      } else if (!cardsDone) {
        setCoachPhase('cards');
      } else {
        setCoachPhase('done');
      }
      setCoachReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!previewPlace || activationPromptedRef.current) {
      return;
    }
    void (async () => {
      const [exploreDone, cardsDone, activationDone] = await Promise.all([
        getMapCoachmarkExploreDone(),
        getMapCoachmarkCardsDone(),
        getMapCoachmarkActivationDone(),
      ]);
      if (!exploreDone || !cardsDone || activationDone) {
        return;
      }
      activationPromptedRef.current = true;
      setActivationVisible(true);
    })();
  }, [previewPlace]);

  const onDismissExploreCoachmark = useCallback(async () => {
    await setMapCoachmarkExploreDone();
    const cardsDone = await getMapCoachmarkCardsDone();
    setCoachPhase(cardsDone ? 'done' : 'cards');
  }, []);

  const onDismissCardsCoachmark = useCallback(async () => {
    await setMapCoachmarkCardsDone();
    setCoachPhase('done');
  }, []);

  const onDismissActivationCoachmark = useCallback(async () => {
    await setMapCoachmarkActivationDone();
    setActivationVisible(false);
  }, []);

  const coachBanner = useMemo(() => {
    if (!coachReady) {
      return null;
    }
    if (activationVisible) {
      return (
        <Card>
          <Card.Body style={{ gap: 10 }}>
            <Card.Title>{t('coachmarks.mapActivation')}</Card.Title>
            <Button variant="primary" onPress={() => void onDismissActivationCoachmark()}>
              {t('coachmarks.mapActivationCta')}
            </Button>
          </Card.Body>
        </Card>
      );
    }
    if (coachPhase === 'explore') {
      return (
        <Card>
          <Card.Body style={{ gap: 10 }}>
            <Card.Title>{t('coachmarks.mapExplore')}</Card.Title>
            <Button variant="primary" onPress={() => void onDismissExploreCoachmark()}>
              {t('coachmarks.mapExploreCta')}
            </Button>
          </Card.Body>
        </Card>
      );
    }
    if (coachPhase === 'cards') {
      return (
        <Card>
          <Card.Body style={{ gap: 10 }}>
            <Card.Title>{t('coachmarks.mapCards')}</Card.Title>
            <Button variant="primary" onPress={() => void onDismissCardsCoachmark()}>
              {t('coachmarks.mapCardsCta')}
            </Button>
          </Card.Body>
        </Card>
      );
    }
    return null;
  }, [
    activationVisible,
    coachPhase,
    coachReady,
    onDismissActivationCoachmark,
    onDismissCardsCoachmark,
    onDismissExploreCoachmark,
    t,
  ]);

  const resolvePlaceForCard = useCallback(
    (card: MapListingCard): MapPlaceRecord | undefined => {
      const cardId = typeof card.id === 'number' ? card.id : Number(card.id);
      if (Number.isNaN(cardId)) {
        return undefined;
      }
      return rawListings.find((r) => r.id === cardId && r.mapPlaceCollection === card.mapPlaceCollection);
    },
    [rawListings],
  );

  const openPreviewForCard = useCallback(
    (card: MapListingCard) => {
      const found = resolvePlaceForCard(card);
      if (found) {
        setPreviewPlace(found);
      }
    },
    [resolvePlaceForCard],
  );

  const onHeartPress = useCallback(
    (card: MapListingCard) => {
      if (!user) {
        navigateToAuthModal(navigation);
        return;
      }
      if (!card.interaction?.canFavorite) {
        return;
      }
      Alert.alert('Coming soon', 'Saving favorites from the map will be available in a future update.');
    },
    [navigation, user],
  );

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const listingTypeMatch =
        listingTypeFilter === 'All' || item.mapPlaceCollection === listingTypeFilter;
      const searchTerm = search.trim().toLowerCase();
      const searchMatch = item.title.toLowerCase().includes(searchTerm);
      return listingTypeMatch && searchMatch;
    });
  }, [listingTypeFilter, listings, search]);

  const listingsToRender: Array<MapListingCard | MapListingCardPlaceholder> =
    isFetching && filteredListings.length === 0
      ? [{}, {}, {}]
      : filteredListings.length > 0
        ? filteredListings
        : [{}];

  const showMetaSkeleton = isFetching;

  const mapStyleURL = resolvedScheme === 'dark' ? MAPBOX_STYLE_DARK : MAPBOX_STYLE_STREETS;

  if (!mapboxAccessToken) {
    return (
      <View
        className="flex-1 bg-background"
        style={{
          paddingTop: insets.top + MAP_OVERLAY_TOP_GAP,
          paddingHorizontal: MAP_OVERLAY_HORIZONTAL_PADDING,
          justifyContent: 'center',
        }}
      >
        <Card>
          <Card.Body>
            <Card.Title>Map unavailable</Card.Title>
            <Card.Description>Missing EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN</Card.Description>
          </Card.Body>
        </Card>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ListingPreviewSheet
        place={previewPlace}
        serverOrigin={PAYLOAD_SERVER_ORIGIN}
        open={previewPlace !== null}
        onOpenChange={(next) => {
          if (!next) {
            setPreviewPlace(null);
          }
        }}
        navigation={navigation}
      />
      <Mapbox.MapView
        style={{ flex: 1 }}
        styleURL={mapStyleURL}
        compassEnabled={false}
        scaleBarEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
        onCameraChanged={onCameraChanged}
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
            <SearchField.Input placeholder="Search places" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: CATEGORY_SCROLL_GAP, paddingRight: CATEGORY_SCROLL_GAP }}>
            {MAP_PLACE_FILTERS.map((item) => {
              const selected = item.value === listingTypeFilter;
              return (
                <Chip
                  key={item.value}
                  variant={selected ? 'primary' : 'secondary'}
                  onPress={() => setListingTypeFilter(item.value)}
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
              <Card.Title>Places unavailable</Card.Title>
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
          <Text style={{ color: MAP_OVERLAY_CHROME_TEXT_COLOR, fontWeight: '600' }}>
            {isFetching ? '...' : filteredListings.length} place{filteredListings.length === 1 ? '' : 's'}
          </Text>
          <Text style={{ color: MAP_OVERLAY_CHROME_TEXT_COLOR }}>From Payload</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: CARD_SCROLL_GAP, paddingRight: CARD_SCROLL_GAP }}>
            {listingsToRender.map((listing, index) => {
              const rowKey =
                isMapListingCard(listing) && listing.id != null
                  ? `${listing.mapPlaceCollection}-${String(listing.id)}`
                  : `placeholder-${index}`;
              return (
                <Card
                  key={rowKey}
                  style={{
                    width: CARD_WIDTH,
                    overflow: 'hidden',
                    borderRadius: CARD_CORNER_RADIUS,
                  }}
                >
                  <Pressable
                    onPress={() => {
                      if (isMapListingCard(listing)) {
                        openPreviewForCard(listing);
                      }
                    }}
                  >
                    <Skeleton isLoading={!isMapListingCard(listing) || !listing.imageUrl} className="h-40 w-full rounded-none" variant="pulse">
                      <View style={{ position: 'relative' }}>
                        {isMapListingCard(listing) && listing.imageUrl ? (
                          <Image
                            source={{ uri: listing.imageUrl }}
                            style={{ width: '100%', height: CARD_IMAGE_HEIGHT }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={{ width: '100%', height: CARD_IMAGE_HEIGHT, backgroundColor: listingImagePlaceholderBg }} />
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
                            onPress={() => {
                              if (isMapListingCard(listing)) {
                                onHeartPress(listing);
                              }
                            }}
                          >
                            <Button.Label>
                              {isMapListingCard(listing) && listing.loved ? (
                                <Ionicons name="heart" size={16} color={listingCardIconColor} />
                              ) : (
                                <Ionicons name="heart-outline" size={16} color={listingCardIconColor} />
                              )}
                            </Button.Label>
                          </Button>
                        </View>
                      </View>
                    </Skeleton>

                    <Card.Body>
                      <Skeleton isLoading={!isMapListingCard(listing) || !listing.title} className="mt-2 h-5 w-48 rounded-md" variant="pulse">
                        <Card.Title>{isMapListingCard(listing) ? listing.title : null}</Card.Title>
                      </Skeleton>
                      {showMetaSkeleton ? (
                        <Skeleton className="mt-2 h-4 w-64 rounded-md" isLoading variant="pulse">
                          <Card.Description> </Card.Description>
                        </Skeleton>
                      ) : isMapListingCard(listing) && listing.rating !== undefined && listing.reviews !== undefined ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                          <Card.Description>{listing.rating.toFixed(1)}</Card.Description>
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                            {Array.from({ length: RATING_DOT_COUNT }).map((_, dotIndex) => {
                              const ratingScore = listing.rating;
                              if (ratingScore === undefined) {
                                return null;
                              }
                              const filled = dotIndex < Math.round(ratingScore);
                              return (
                                <View
                                  key={`${rowKey}-dot-${dotIndex}`}
                                  style={{
                                    width: RATING_DOT_SIZE,
                                    height: RATING_DOT_SIZE,
                                    borderRadius: RATING_DOT_SIZE / 2,
                                    backgroundColor: filled ? ratingFilledColor : ratingTrackColor,
                                  }}
                                />
                              );
                            })}
                          </View>
                          <Card.Description>({listing.reviews})</Card.Description>
                          <Card.Description>·</Card.Description>
                          <Card.Description>{listing.distanceKm?.toFixed(1)} km away</Card.Description>
                        </View>
                      ) : isMapListingCard(listing) && listing.distanceKm !== undefined ? (
                        <Card.Description style={{ marginTop: 8 }}>
                          {listing.distanceKm.toFixed(1)} km from map area
                        </Card.Description>
                      ) : null}
                      <Skeleton isLoading={!isMapListingCard(listing) || !listing.kindLabel} className="mt-2 h-3 w-24 rounded-md" variant="pulse">
                        <Card.Description>{isMapListingCard(listing) ? listing.kindLabel : null}</Card.Description>
                      </Skeleton>
                      {isMapListingCard(listing) && listing.interaction && !listing.interaction.canInteract ? (
                        <Card.Description style={{ marginTop: 6 }}>
                          Interaction locked ({listing.interaction.reason.replaceAll('_', ' ')})
                        </Card.Description>
                      ) : null}
                    </Card.Body>
                  </Pressable>
                </Card>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {coachBanner ? (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            left: MAP_OVERLAY_HORIZONTAL_PADDING,
            right: MAP_OVERLAY_HORIZONTAL_PADDING,
            bottom: tabBarHeight + MAP_OVERLAY_BOTTOM_GAP + MAP_COACHMARK_OVERLAY_EXTRA_GAP,
            zIndex: 40,
          }}
        >
          {coachBanner}
        </View>
      ) : null}
    </View>
  );
}
