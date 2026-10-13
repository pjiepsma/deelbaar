import { useLocalSearchParams, useRouter } from 'expo-router';
import Mapbox from '@rnmapbox/maps';
import { Spinner } from 'heroui-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../context/AuthContext';
import { firstRouteParam } from '../../navigation/routeParams';
import type { MapPlaceCollection } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import { useLocale } from '../../context/LocaleContext';
import { useDiscoveryArea } from '../../context/DiscoveryAreaContext';
import {
  getCachedPlaceDetail,
  isPlaceDetailCacheStale,
  loadPlaceDetailWithReviews,
  logPlaceDetailCacheAccess,
  setCachedPlaceDetail,
} from '../../lib/listings/placeDetailPrefetchCache';
import { consumePlaceDetailShellSnapshot } from '../../lib/listings/placeDetailNavigationShell';
import { resolveDeviceLngLat } from '../../lib/location/resolveDeviceLngLat';
import { runMapProtectedAction } from '../map/mapProtectedAction';
import { mapPayloadListingToMapCard } from '../map/mapListing.mapper';
import type { MapPlaceRecord } from '../map/map.types';
import { Ionicons } from '@expo/vector-icons';
import { PlaceDetailContent } from './PlaceDetailContent';
import { PlaceDetailLoadingShell } from './PlaceDetailLoadingShell';
import { HeroChromeButton } from './HeroChromeButton';
import type { PlaceDetailHeroMode } from './PlaceDetailHero';
import { resolveHeroPhotoUrls, resolvePlaceLngLat } from './placeDetail.model';
import type { PlaceDetailReviewRow } from './placeDetailReviews.model';
import { showPlaceDetailContributorComingSoon } from './placeDetailActions';
import { PLACE_DETAIL_BG } from './placeDetail.constants';
import { TestId } from '../../testing/testIds';

function parseListingId(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`ListingDetailScreen requires numeric id, got: ${raw ?? 'undefined'}`);
  }
  return parsed;
}

export function ListingDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ collection?: string | string[]; id?: string | string[] }>();
  const collection = firstRouteParam(params.collection) as MapPlaceCollection | undefined;
  const id = parseListingId(firstRouteParam(params.id));
  if (!collection) {
    throw new Error('ListingDetailScreen requires collection route param');
  }
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { referenceLngLat } = useDiscoveryArea();
  const serverOrigin = process.env.EXPO_PUBLIC_PAYLOAD_SERVER_URL;
  const mapboxAccessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const shellSnapshot = useMemo(
    () => consumePlaceDetailShellSnapshot(collection, id),
    [collection, id],
  );

  const [place, setPlace] = useState<MapPlaceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroMode, setHeroMode] = useState<PlaceDetailHeroMode>('photos');
  const [userLngLat, setUserLngLat] = useState<[number, number] | null>(null);
  const [reviews, setReviews] = useState<PlaceDetailReviewRow[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!mapboxAccessToken) {
      return;
    }
    Mapbox.setAccessToken(mapboxAccessToken);
  }, [mapboxAccessToken]);

  useEffect(() => {
    void (async () => {
      const lngLat = await resolveDeviceLngLat();
      setUserLngLat(lngLat);
    })();
  }, []);

  const applyLoaded = useCallback(
    (loadedPlace: MapPlaceRecord, loadedReviews: PlaceDetailReviewRow[]) => {
      setPlace(loadedPlace);
      setReviews(loadedReviews);
      setError(null);
      setCachedPlaceDetail(collection, id, {
        place: loadedPlace,
        reviews: loadedReviews,
      });
    },
    [collection, id],
  );

  const loadFresh = useCallback(
    async (background: boolean) => {
      if (!background) {
        setLoading(true);
        setError(null);
      }
      try {
        const loaded = await loadPlaceDetailWithReviews({
          collection,
          id,
          locale,
          serverOrigin,
        });
        if (!loaded) {
          if (!background) {
            setError(t('listing.notFound'));
            setPlace(null);
            setReviews([]);
          }
          return;
        }
        applyLoaded(loaded.place, loaded.reviews);
      } catch (_e) {
        if (!background) {
          setError(t('listing.couldNotLoad'));
          setPlace(null);
          setReviews([]);
        }
      } finally {
        if (!background) {
          setLoading(false);
        }
      }
    },
    [applyLoaded, collection, id, locale, serverOrigin, t],
  );

  const load = useCallback(async () => {
    const cached = getCachedPlaceDetail(collection, id);
    if (cached) {
      logPlaceDetailCacheAccess(collection, id, true);
      applyLoaded(cached.place, cached.reviews);
      setLoading(false);
      if (isPlaceDetailCacheStale(cached)) {
        void loadFresh(true);
      }
      return;
    }

    logPlaceDetailCacheAccess(collection, id, false);
    await loadFresh(false);
  }, [applyLoaded, collection, id, loadFresh]);

  useEffect(() => {
    void load();
  }, [load]);

  const card = useMemo(() => {
    if (!place || !serverOrigin) {
      return null;
    }
    return mapPayloadListingToMapCard(place, serverOrigin, referenceLngLat);
  }, [place, referenceLngLat, serverOrigin]);

  const photoUrls = useMemo(() => {
    if (!place || !serverOrigin || !card) {
      if (shellSnapshot?.imageUrl) {
        return [shellSnapshot.imageUrl];
      }
      return [];
    }
    return resolveHeroPhotoUrls(place, serverOrigin, card.imageUrl);
  }, [card, place, serverOrigin, shellSnapshot?.imageUrl]);

  const listingLngLat = place ? resolvePlaceLngLat(place) : null;

  const onLeaveReviewPress = useCallback(() => {
    if (!user) {
      return;
    }
    showPlaceDetailContributorComingSoon(t);
  }, [t, user]);

  const onAddPhotoPress = useCallback(() => {
    if (!user) {
      return;
    }
    showPlaceDetailContributorComingSoon(t);
  }, [t, user]);

  const onSavePress = useCallback(() => {
    if (!place) {
      return;
    }
    runMapProtectedAction({
      user,
      allowed: !!place.interaction?.canFavorite,
      t,
    });
  }, [place, t, user]);

  if (loading && !place) {
    if (shellSnapshot) {
      return (
        <PlaceDetailLoadingShell
          shell={shellSnapshot}
          onBack={() => router.back()}
          t={t}
          topInset={insets.top}
        />
      );
    }
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PLACE_DETAIL_BG }}>
        <Spinner size="lg" />
      </View>
    );
  }

  if (error || !place || !card) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: PLACE_DETAIL_BG,
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
        }}
      >
        <HeroChromeButton
          testID={TestId.btnBack}
          onPress={() => router.back()}
          accessibilityLabel={t('listing.back')}
        >
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </HeroChromeButton>
        <Text className="text-foreground mt-4 text-lg font-semibold">{t('listing.unavailableTitle')}</Text>
        <Text className="text-muted mt-2 text-base">{error ?? t('listing.unknownError')}</Text>
      </View>
    );
  }

  return (
    <PlaceDetailContent
      place={place}
      card={card}
      photoUrls={photoUrls}
      listingLngLat={listingLngLat}
      userLngLat={userLngLat}
      mapboxAccessToken={mapboxAccessToken}
      heroMode={heroMode}
      onHeroModeChange={setHeroMode}
      onBack={() => router.back()}
      onSavePress={onSavePress}
      loved={card.loved ?? false}
      reviews={reviews}
      user={user}
      onLeaveReviewPress={onLeaveReviewPress}
      onAddPhotoPress={onAddPhotoPress}
      t={t}
    />
  );
}
