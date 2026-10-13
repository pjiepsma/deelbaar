import Mapbox from '@rnmapbox/maps';
import { Button, Card } from 'heroui-native';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../context/AuthContext';
import { useDiscoveryArea } from '../../context/DiscoveryAreaContext';
import { useLocale } from '../../context/LocaleContext';
import { useThemePreference } from '../../context/ThemePreferenceContext';
import { toggleFavoritePlace } from '../../lib/api/favorites/toggleFavorite';
import { resolveDeviceLngLat } from '../../lib/location/resolveDeviceLngLat';
import { type MapPlaceFilterValue } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import {
  MAPBOX_STYLE_DARK,
  MAPBOX_STYLE_STREETS,
  MAP_CAMERA_DEBOUNCE_MS,
  MAP_CAROUSEL_CAMERA_ANIMATION_MS,
  MAP_CAROUSEL_CAMERA_NUDGE,
  MAP_CAROUSEL_IN_VIEW_MARGIN,
  MAP_CAROUSEL_SNAP_CAMERA_DEBOUNCE_MS,
  MAP_CAROUSEL_VIEWPORT_MARGIN,
  MAP_AREA_SEARCH_ZOOM,
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MARKER_VIEWPORT_MARGIN,
  MAP_MAX_RENDERED_PINS,
  MAP_OVERLAY_HORIZONTAL_PADDING,
  MAP_OVERLAY_TOP_GAP,
  MAP_VIEWPORT_BOTTOM_CHROME_ESTIMATE_PX,
  MAP_VIEWPORT_TOP_CHROME_ESTIMATE_PX,
  MAP_ZOOM_STATE_THROTTLE_MS,
  mapCoachmarkBottom,
  mapMyLocationBottom,
} from './map.constants';
import { tabBarOverlayClearance } from '../../navigation/tabBarClearance';
import { TestId } from '../../testing/testIds';
import {
  getMapCoachmarkActivationDone,
  getMapCoachmarkCardsDone,
  getMapCoachmarkExploreDone,
  setMapCoachmarkActivationDone,
  setMapCoachmarkCardsDone,
  setMapCoachmarkExploreDone,
} from '../onboarding/mapCoachmarks.storage';
import { mapPayloadListingsToMapCards, sortMapCardsByDistance } from './mapListing.mapper';
import { coordinatesNear, normalizeMapZoom } from './mapCenter';
import {
  cameraCenterTowardListing,
  filterListingsInMapViewport,
  isListingInMapView,
  listingMarkerKey,
} from './mapViewport';
import { setPlaceDetailShellSnapshot } from '../../lib/listings/placeDetailNavigationShell';
import { navigateToListingDetail } from '../../navigation/rootNavigation';
import { MapAreaSearchField } from './MapAreaSearchField';
import { MapCategoryFilter } from './MapCategoryFilter';
import { MapListingCarousel } from './MapListingCarousel';
import { MapListingMarkers } from './MapListingMarkers';
import { MapMyLocationButton } from './MapMyLocationButton';
import { MapResultCount } from './MapResultCount';
import { MapTopChrome } from './MapTopChrome';
import { runMapProtectedAction } from './mapProtectedAction';
import { useInitialMapCenterFromDevice } from './useInitialMapCenterFromDevice';
import { useMapListingsFetch } from './useMapListingsFetch';
import { usePrefetchFocusedPlaceDetail } from './usePrefetchFocusedPlaceDetail';
import { type MapListingCard, type MapListingCardPlaceholder } from './map.types';

const PAYLOAD_SERVER_ORIGIN = process.env.EXPO_PUBLIC_PAYLOAD_SERVER_URL;

type CameraChangedPayload = {
  properties?: {
    center?: number[];
    zoom?: number;
  };
};

export function MapScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [listingTypeFilter, setListingTypeFilter] = useState<MapPlaceFilterValue>('All');
  const [focusedListing, setFocusedListing] = useState<MapListingCard | null>(null);
  const [mapViewportCenter, setMapViewportCenter] = useState<[number, number]>(MAP_CENTER);
  const [mapViewportZoom, setMapViewportZoom] = useState(MAP_DEFAULT_ZOOM);
  const insets = useSafeAreaInsets();
  const overlayTabClearance = tabBarOverlayClearance(insets.bottom);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { referenceLngLat, setReferenceLngLat } = useDiscoveryArea();
  const cameraDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zoomThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const carouselCameraDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraRef = useRef<Mapbox.Camera>(null);
  const programmaticCameraRef = useRef(false);
  const mapZoomRef = useRef(MAP_DEFAULT_ZOOM);
  const mapViewportCenterRef = useRef<[number, number]>(MAP_CENTER);
  const pendingCameraCenterRef = useRef<[number, number]>(MAP_CENTER);
  const referenceLngLatRef = useRef(referenceLngLat);
  referenceLngLatRef.current = referenceLngLat;
  mapViewportCenterRef.current = mapViewportCenter;
  const mapboxAccessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
  /** Prefetch buffer uses longer screen half; in-view filter uses readable map band. */
  const fetchViewportHalfPx = Math.max(screenWidth, screenHeight) / 2;
  const mapViewportSize = useMemo(() => {
    const visibleMapHeight = Math.max(
      screenHeight * 0.35,
      screenHeight - MAP_VIEWPORT_TOP_CHROME_ESTIMATE_PX - MAP_VIEWPORT_BOTTOM_CHROME_ESTIMATE_PX,
    );
    return {
      halfWidthPx: screenWidth / 2,
      halfHeightPx: visibleMapHeight / 2,
    };
  }, [screenHeight, screenWidth]);
  const listingsFetchEnabled = !!PAYLOAD_SERVER_ORIGIN;

  const { rawListings, isFetching, fetchError, requestFetch, maybeRefetchForViewport } =
    useMapListingsFetch({
      center: mapViewportCenter,
      zoom: mapViewportZoom,
      viewportHalfPx: fetchViewportHalfPx,
      collectionFilter: listingTypeFilter,
      enabled: listingsFetchEnabled,
      unavailableMessage: t('map.placesUnavailableDescription'),
    });

  usePrefetchFocusedPlaceDetail({
    focusedListing,
    enabled: listingsFetchEnabled,
  });

  const syncMapDiscoveryCenter = useCallback(
    (lngLat: [number, number], zoom: number) => {
      referenceLngLatRef.current = lngLat;
      mapViewportCenterRef.current = lngLat;
      mapZoomRef.current = zoom;
      setReferenceLngLat(lngLat);
      setMapViewportCenter(lngLat);
      setMapViewportZoom(zoom);
    },
    [setReferenceLngLat],
  );

  const moveCameraToListing = useCallback(
    (listing: MapListingCard) => {
      if (!listing.lngLat || !mapboxAccessToken) {
        return;
      }

      const currentCenter = mapViewportCenterRef.current;
      const zoom = normalizeMapZoom(mapZoomRef.current, MAP_DEFAULT_ZOOM);
      const inView = isListingInMapView(
        listing.lngLat,
        currentCenter,
        zoom,
        mapViewportSize,
        MAP_CAROUSEL_IN_VIEW_MARGIN,
      );
      const targetCenter = inView
        ? cameraCenterTowardListing(currentCenter, listing.lngLat, MAP_CAROUSEL_CAMERA_NUDGE)
        : listing.lngLat;

      programmaticCameraRef.current = true;
      cameraRef.current?.setCamera({
        centerCoordinate: targetCenter,
        zoomLevel: zoom,
        animationDuration: MAP_CAROUSEL_CAMERA_ANIMATION_MS,
      });
      setTimeout(() => {
        programmaticCameraRef.current = false;
        setMapViewportCenter(targetCenter);
      }, MAP_CAROUSEL_CAMERA_ANIMATION_MS + 100);
    },
    [mapViewportSize, mapboxAccessToken],
  );

  const onFocusedListingChange = useCallback((listing: MapListingCard | null) => {
    setFocusedListing(listing);
  }, []);

  const onCarouselSnap = useCallback(
    (listing: MapListingCard) => {
      if (carouselCameraDebounceRef.current) {
        clearTimeout(carouselCameraDebounceRef.current);
      }
      carouselCameraDebounceRef.current = setTimeout(() => {
        moveCameraToListing(listing);
      }, MAP_CAROUSEL_SNAP_CAMERA_DEBOUNCE_MS);
    },
    [moveCameraToListing],
  );

  const onAreaSelect = useCallback(
    (lngLat: [number, number]) => {
      if (!mapboxAccessToken) {
        return;
      }
      const zoom = MAP_AREA_SEARCH_ZOOM;
      setFocusedListing(null);
      syncMapDiscoveryCenter(lngLat, zoom);
      requestFetch({
        center: lngLat,
        zoom,
        mode: 'foreground',
        collectionFilter: listingTypeFilter,
      });
      programmaticCameraRef.current = true;
      cameraRef.current?.setCamera({
        centerCoordinate: lngLat,
        zoomLevel: zoom,
        animationDuration: MAP_CAROUSEL_CAMERA_ANIMATION_MS,
      });
      setTimeout(() => {
        programmaticCameraRef.current = false;
      }, MAP_CAROUSEL_CAMERA_ANIMATION_MS + 100);
    },
    [listingTypeFilter, mapboxAccessToken, requestFetch, syncMapDiscoveryCenter],
  );

  const onDeviceLocationResolved = useCallback(
    (lngLat: [number, number] | null) => {
      if (!lngLat || !mapboxAccessToken) {
        return;
      }
      if (coordinatesNear(lngLat, MAP_CENTER)) {
        return;
      }
      programmaticCameraRef.current = true;
      cameraRef.current?.setCamera({
        centerCoordinate: lngLat,
        zoomLevel: MAP_DEFAULT_ZOOM,
        animationDuration: 600,
      });
      setTimeout(() => {
        programmaticCameraRef.current = false;
        syncMapDiscoveryCenter(lngLat, MAP_DEFAULT_ZOOM);
        requestFetch({
          center: lngLat,
          zoom: MAP_DEFAULT_ZOOM,
          mode: 'foreground',
          collectionFilter: listingTypeFilter,
        });
      }, 700);
    },
    [listingTypeFilter, mapboxAccessToken, requestFetch, syncMapDiscoveryCenter],
  );

  const onMyLocationPress = useCallback(() => {
    void (async () => {
      const lngLat = await resolveDeviceLngLat();
      if (!lngLat || !mapboxAccessToken) {
        Alert.alert(t('map.myLocation'), t('map.myLocationUnavailable'));
        return;
      }
      setFocusedListing(null);
      syncMapDiscoveryCenter(lngLat, MAP_DEFAULT_ZOOM);
      requestFetch({
        center: lngLat,
        zoom: MAP_DEFAULT_ZOOM,
        mode: 'foreground',
        collectionFilter: listingTypeFilter,
      });
      programmaticCameraRef.current = true;
      cameraRef.current?.setCamera({
        centerCoordinate: lngLat,
        zoomLevel: MAP_DEFAULT_ZOOM,
        animationDuration: MAP_CAROUSEL_CAMERA_ANIMATION_MS,
      });
      setTimeout(() => {
        programmaticCameraRef.current = false;
      }, MAP_CAROUSEL_CAMERA_ANIMATION_MS + 100);
    })();
  }, [listingTypeFilter, mapboxAccessToken, requestFetch, syncMapDiscoveryCenter, t]);

  useInitialMapCenterFromDevice(setReferenceLngLat, onDeviceLocationResolved);

  const { resolvedScheme } = useThemePreference();

  useLayoutEffect(() => {
    if (!mapboxAccessToken) {
      return;
    }
    Mapbox.setAccessToken(mapboxAccessToken);
  }, [mapboxAccessToken]);

  const listings = useMemo(() => {
    if (!PAYLOAD_SERVER_ORIGIN) {
      return [];
    }
    return mapPayloadListingsToMapCards(rawListings, PAYLOAD_SERVER_ORIGIN, referenceLngLat);
  }, [rawListings, referenceLngLat]);

  const onCameraChanged = useCallback(
    (event: CameraChangedPayload) => {
      if (programmaticCameraRef.current) {
        return;
      }
      const center = event.properties?.center;
      if (!Array.isArray(center) || center.length < 2) {
        return;
      }
      const lng = center[0];
      const lat = center[1];
      if (typeof lng !== 'number' || typeof lat !== 'number' || Number.isNaN(lng) || Number.isNaN(lat)) {
        return;
      }
      const nextCenter: [number, number] = [lng, lat];
      pendingCameraCenterRef.current = nextCenter;
      const zoom = event.properties?.zoom;
      if (typeof zoom === 'number' && !Number.isNaN(zoom)) {
        mapZoomRef.current = normalizeMapZoom(zoom, MAP_DEFAULT_ZOOM);
      }

      if (zoomThrottleRef.current) {
        clearTimeout(zoomThrottleRef.current);
      }
      zoomThrottleRef.current = setTimeout(() => {
        const uiCenter = pendingCameraCenterRef.current;
        const uiZoom = mapZoomRef.current;
        mapViewportCenterRef.current = uiCenter;
        setMapViewportCenter(uiCenter);
        setMapViewportZoom(uiZoom);
        setFocusedListing((current) => {
          if (!current?.lngLat) {
            return current;
          }
          return isListingInMapView(
            current.lngLat,
            uiCenter,
            uiZoom,
            mapViewportSize,
            MAP_CAROUSEL_VIEWPORT_MARGIN,
          )
            ? current
            : null;
        });
      }, MAP_ZOOM_STATE_THROTTLE_MS);

      if (coordinatesNear(nextCenter, referenceLngLatRef.current)) {
        return;
      }
      if (cameraDebounceRef.current) {
        clearTimeout(cameraDebounceRef.current);
      }
      cameraDebounceRef.current = setTimeout(() => {
        const discoveryCenter = pendingCameraCenterRef.current;
        setReferenceLngLat(discoveryCenter);
        maybeRefetchForViewport(discoveryCenter, mapZoomRef.current);
      }, MAP_CAMERA_DEBOUNCE_MS);
    },
    [mapViewportSize, maybeRefetchForViewport, setReferenceLngLat],
  );

  useEffect(() => {
    return () => {
      if (cameraDebounceRef.current) {
        clearTimeout(cameraDebounceRef.current);
      }
      if (zoomThrottleRef.current) {
        clearTimeout(zoomThrottleRef.current);
      }
      if (carouselCameraDebounceRef.current) {
        clearTimeout(carouselCameraDebounceRef.current);
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

  const onSelectListingFromMap = useCallback(
    (listing: MapListingCard) => {
      setFocusedListing(listing);
      moveCameraToListing(listing);
    },
    [moveCameraToListing],
  );

  const openDetailForCard = useCallback(
    (card: MapListingCard) => {
      const cardId = typeof card.id === 'number' ? card.id : Number(card.id);
      if (Number.isNaN(cardId)) {
        return;
      }
      setPlaceDetailShellSnapshot(card);
      setDetailVisitToken((token) => token + 1);
      navigateToListingDetail({
        collection: card.mapPlaceCollection,
        id: cardId,
      });
    },
    [],
  );

  const [lovedOverrides, setLovedOverrides] = useState<Record<string, boolean>>({});

  const onHeartPress = useCallback(
    (card: MapListingCard) => {
      if (card.id === undefined) {
        return;
      }
      const placeId = typeof card.id === 'number' ? card.id : Number(card.id);
      if (!Number.isFinite(placeId)) {
        return;
      }
      const markerKey = listingMarkerKey(card);
      runMapProtectedAction({
        user,
        allowed: !!card.interaction?.canFavorite,
        t,
        onAllowed: () => {
          if (!user || !markerKey) {
            return;
          }
          void (async () => {
            try {
              const result = await toggleFavoritePlace({
                userId: user.id,
                collection: card.mapPlaceCollection,
                placeId,
              });
              setLovedOverrides((previous) => ({ ...previous, [markerKey]: result.loved }));
            } catch {
              Alert.alert(t('listing.saveFailedTitle'), t('listing.saveFailedDescription'));
            }
          })();
        },
      });
    },
    [t, user],
  );

  const listingsWithLoved = useMemo(() => {
    return listings.map((item) => {
      const key = listingMarkerKey(item);
      if (!key || lovedOverrides[key] === undefined) {
        return item;
      }
      return { ...item, loved: lovedOverrides[key] };
    });
  }, [listings, lovedOverrides]);

  const filteredListings = useMemo(() => {
    return listingsWithLoved.filter((item) => {
      return listingTypeFilter === 'All' || item.mapPlaceCollection === listingTypeFilter;
    });
  }, [listingTypeFilter, listingsWithLoved]);

  const carouselFilterKey = listingTypeFilter;

  const carouselListings = useMemo(() => {
    const inViewport = filterListingsInMapViewport(
      filteredListings,
      mapViewportCenter,
      mapViewportZoom,
      mapViewportSize,
      MAP_CAROUSEL_VIEWPORT_MARGIN,
    );
    return sortMapCardsByDistance(inViewport);
  }, [filteredListings, mapViewportCenter, mapViewportSize, mapViewportZoom]);

  const markerListings = useMemo(() => {
    const inViewport = filterListingsInMapViewport(
      filteredListings,
      mapViewportCenter,
      mapViewportZoom,
      mapViewportSize,
      MAP_MARKER_VIEWPORT_MARGIN,
    );

    let merged = inViewport;
    if (focusedListing?.lngLat) {
      const focusedKey = listingMarkerKey(focusedListing);
      if (focusedKey) {
        const freshFocused =
          filteredListings.find((item) => listingMarkerKey(item) === focusedKey) ?? focusedListing;
        const alreadyIncluded = inViewport.some((item) => listingMarkerKey(item) === focusedKey);
        if (!alreadyIncluded) {
          merged = [...inViewport, freshFocused];
        }
      }
    }

    const sorted = sortMapCardsByDistance(merged);
    if (sorted.length <= MAP_MAX_RENDERED_PINS) {
      return sorted;
    }
    return sorted.slice(0, MAP_MAX_RENDERED_PINS);
  }, [filteredListings, focusedListing, mapViewportCenter, mapViewportSize, mapViewportZoom]);

  const listingsToRender: Array<MapListingCard | MapListingCardPlaceholder> =
    isFetching && carouselListings.length === 0
      ? [{}, {}, {}]
      : carouselListings;

  const focusedListingKey = focusedListing ? listingMarkerKey(focusedListing) : null;

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
    <View testID={TestId.screenMap} style={{ flex: 1 }}>
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
            centerCoordinate: MAP_CENTER,
            zoomLevel: MAP_DEFAULT_ZOOM,
          }}
        />
        <MapListingMarkers
          listings={markerListings}
          focusedListingKey={focusedListingKey}
          onSelectListing={onSelectListingFromMap}
        />
      </Mapbox.MapView>

      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: insets.top + MAP_OVERLAY_TOP_GAP,
          left: MAP_OVERLAY_HORIZONTAL_PADDING,
          right: MAP_OVERLAY_HORIZONTAL_PADDING,
          zIndex: 30,
        }}
      >
        <MapTopChrome>
          <MapAreaSearchField
            accessToken={mapboxAccessToken}
            proximityLngLat={mapViewportCenter}
            onAreaSelect={onAreaSelect}
          />
          <MapCategoryFilter value={listingTypeFilter} onChange={setListingTypeFilter} />
          <MapResultCount
            count={carouselListings.length}
            isFetching={isFetching}
          />
        </MapTopChrome>
      </View>

      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          right: MAP_OVERLAY_HORIZONTAL_PADDING,
          bottom: mapMyLocationBottom(overlayTabClearance),
        }}
      >
        <MapMyLocationButton onPress={onMyLocationPress} accessibilityLabel={t('map.myLocation')} />
      </View>

      <MapListingCarousel
        listings={listingsToRender}
        focusedListingKey={focusedListingKey}
        filterKey={carouselFilterKey}
        isFetching={isFetching}
        fetchError={fetchError}
        fetchErrorTitle={t('map.placesUnavailableTitle')}
        fetchErrorDescription={fetchError ?? ''}
        emptyTitle={t('map.noPlacesInViewTitle')}
        emptyDescription={t('map.noPlacesInViewDescription')}
        signedIn={!!user}
        onPressCard={openDetailForCard}
        onHeartPress={onHeartPress}
        onFocusedListingChange={onFocusedListingChange}
        onCarouselSnap={onCarouselSnap}
      />

      {coachBanner ? (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            left: MAP_OVERLAY_HORIZONTAL_PADDING,
            right: MAP_OVERLAY_HORIZONTAL_PADDING,
            bottom: mapCoachmarkBottom(overlayTabClearance),
            zIndex: 40,
          }}
        >
          {coachBanner}
        </View>
      ) : null}
    </View>
  );
}
