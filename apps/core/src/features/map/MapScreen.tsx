import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import Mapbox from '@rnmapbox/maps';
import { Button, Card, Chip, SearchField } from 'heroui-native';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../context/AuthContext';
import { useDiscoveryArea } from '../../context/DiscoveryAreaContext';
import { useLocale } from '../../context/LocaleContext';
import { useThemePreference } from '../../context/ThemePreferenceContext';
import { fetchLiveListings } from '../../lib/api/listings/fetchLiveListings';
import {
  MAP_PLACE_FILTER_VALUES,
  mapPlaceFilterLabel,
  type MapPlaceFilterValue,
} from '../../lib/mapPlaces/mapPlaceTaxonomy';
import {
  CATEGORY_SCROLL_GAP,
  MAPBOX_STYLE_DARK,
  MAPBOX_STYLE_STREETS,
  MAP_CAMERA_DEBOUNCE_MS,
  MAP_COACHMARK_OVERLAY_EXTRA_GAP,
  MAP_DEFAULT_ZOOM,
  MAP_LISTING_CAROUSEL_BOTTOM_PADDING,
  MAP_OVERLAY_HORIZONTAL_PADDING,
  MAP_OVERLAY_TOP_GAP,
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
import { isDefaultMapCenter } from './mapCenter';
import { navigateToListingDetail } from '../../navigation/rootNavigation';
import { MapListingCarousel } from './MapListingCarousel';
import { runMapProtectedAction } from './mapProtectedAction';
import { useInitialMapCenterFromDevice } from './useInitialMapCenterFromDevice';
import { type MapListingCard, type MapListingCardPlaceholder, type MapPlaceRecord } from './map.types';

const PAYLOAD_SERVER_ORIGIN = process.env.EXPO_PUBLIC_PAYLOAD_SERVER_URL;

type CameraChangedPayload = {
  properties?: {
    center?: number[];
  };
};

export function MapScreen() {
  const navigation = useNavigation() as NavigationProp<ParamListBase>;
  const { user } = useAuth();
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [listingTypeFilter, setListingTypeFilter] = useState<MapPlaceFilterValue>('All');
  const [rawListings, setRawListings] = useState<MapPlaceRecord[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { referenceLngLat, setReferenceLngLat } = useDiscoveryArea();
  useInitialMapCenterFromDevice(referenceLngLat, setReferenceLngLat);
  const { resolvedScheme } = useThemePreference();
  const cameraDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraRef = useRef<Mapbox.Camera>(null);
  const deviceCenteredRef = useRef(false);
  const mapboxAccessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useLayoutEffect(() => {
    if (!mapboxAccessToken) {
      return;
    }
    Mapbox.setAccessToken(mapboxAccessToken);
  }, [mapboxAccessToken]);

  useEffect(() => {
    if (!mapboxAccessToken) {
      return;
    }
    const animate = deviceCenteredRef.current;
    cameraRef.current?.setCamera({
      centerCoordinate: referenceLngLat,
      zoomLevel: MAP_DEFAULT_ZOOM,
      animationDuration: animate ? 600 : 0,
    });
    if (!isDefaultMapCenter(referenceLngLat)) {
      deviceCenteredRef.current = true;
    }
  }, [mapboxAccessToken, referenceLngLat]);

  const loadListings = useCallback(async () => {
    if (!PAYLOAD_SERVER_ORIGIN) {
      setFetchError(t('map.placesUnavailableDescription'));
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    setFetchError(null);
    try {
      const docs = await fetchLiveListings();
      setRawListings(docs);
    } catch (_error) {
      setFetchError(t('map.placesUnavailableDescription'));
      setRawListings([]);
    } finally {
      setIsFetching(false);
    }
  }, [t]);

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

  const activationPromptedRef = useRef(false);
  const [detailVisitToken, setDetailVisitToken] = useState(0);
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
    if (detailVisitToken === 0 || activationPromptedRef.current) {
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
  }, [detailVisitToken]);

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

  const openDetailForCard = useCallback(
    (card: MapListingCard) => {
      const cardId = typeof card.id === 'number' ? card.id : Number(card.id);
      if (Number.isNaN(cardId)) {
        return;
      }
      setDetailVisitToken((token) => token + 1);
      navigateToListingDetail(navigation, {
        collection: card.mapPlaceCollection,
        id: cardId,
      });
    },
    [navigation],
  );

  const onHeartPress = useCallback(
    (card: MapListingCard) => {
      runMapProtectedAction({
        user,
        navigation,
        allowed: !!card.interaction?.canFavorite,
        t,
      });
    },
    [navigation, t, user],
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
            <Card.Title>{t('map.unavailableTitle')}</Card.Title>
            <Card.Description>{t('map.unavailableDescription')}</Card.Description>
          </Card.Body>
        </Card>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Mapbox.MapView
        style={{ flex: 1 }}
        styleURL={mapStyleURL}
        compassEnabled={false}
        scaleBarEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
        onCameraChanged={onCameraChanged}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: referenceLngLat,
            zoomLevel: MAP_DEFAULT_ZOOM,
          }}
        />
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
            <SearchField.Input placeholder={t('map.searchPlaceholder')} />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: CATEGORY_SCROLL_GAP, paddingRight: CATEGORY_SCROLL_GAP }}>
            {MAP_PLACE_FILTER_VALUES.map((value) => {
              const selected = value === listingTypeFilter;
              return (
                <Chip
                  key={value}
                  variant={selected ? 'primary' : 'secondary'}
                  onPress={() => setListingTypeFilter(value)}
                >
                  <Chip.Label>{mapPlaceFilterLabel(value, t)}</Chip.Label>
                </Chip>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <MapListingCarousel
        listings={listingsToRender}
        isFetching={isFetching}
        fetchError={fetchError}
        fetchErrorTitle={t('map.placesUnavailableTitle')}
        fetchErrorDescription={fetchError ?? ''}
        signedIn={!!user}
        onPressCard={openDetailForCard}
        onHeartPress={onHeartPress}
      />

      {coachBanner ? (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            left: MAP_OVERLAY_HORIZONTAL_PADDING,
            right: MAP_OVERLAY_HORIZONTAL_PADDING,
            bottom: MAP_LISTING_CAROUSEL_BOTTOM_PADDING + MAP_COACHMARK_OVERLAY_EXTRA_GAP,
            zIndex: 40,
          }}
        >
          {coachBanner}
        </View>
      ) : null}
    </View>
  );
}
