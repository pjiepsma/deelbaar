import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Mapbox from '@rnmapbox/maps';
import { Spinner } from 'heroui-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../context/AuthContext';
import { useDiscoveryArea } from '../../context/DiscoveryAreaContext';
import { useLocale } from '../../context/LocaleContext';
import { isPlaceInFavorites } from '../../lib/api/favorites/favoriteKeys';
import { toggleFavoritePlace } from '../../lib/api/favorites/toggleFavorite';
import { contributePlacePhoto } from '../../lib/api/listings/contributePlacePhoto';
import { createPlaceReview } from '../../lib/api/reviews/createPlaceReview';
import { fetchCurrentUserFull } from '../../lib/api/users/fetchCurrentUserFull';
import {
  getCachedPlaceDetail,
  loadPlaceDetailWithReviews,
  logPlaceDetailCacheAccess,
  setCachedPlaceDetail,
} from '../../lib/listings/placeDetailPrefetchCache';
import { consumePlaceDetailShellSnapshot } from '../../lib/listings/placeDetailNavigationShell';
import { resolveDeviceLngLat } from '../../lib/location/resolveDeviceLngLat';
import type { MapPlaceCollection } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import { firstRouteParam } from '../../navigation/routeParams';
import { TestId } from '../../testing/testIds';
import { runMapProtectedAction } from '../map/mapProtectedAction';
import { mapPayloadListingToMapCard } from '../map/mapListing.mapper';
import type { MapPlaceRecord } from '../map/map.types';
import { HeroChromeButton } from './HeroChromeButton';
import { PlaceDetailContent } from './PlaceDetailContent';
import { PLACE_DETAIL_BG } from './placeDetail.constants';
import { PlaceDetailLeaveReviewSheet } from './PlaceDetailLeaveReviewSheet';
import { PlaceDetailLoadingShell } from './PlaceDetailLoadingShell';
import { buildPlaceDetailNotices, resolveHeroPhotoUrls, resolvePlaceLngLat } from './placeDetail.model';
import type { PlaceDetailHeroMode } from './PlaceDetailHero';
import { PlaceDetailNoticesSheet } from './PlaceDetailNoticesSheet';
import type { PlaceDetailReviewRow } from './placeDetailReviews.model';
import { mapReviewsToPlaceDetailRows } from './placeDetailReviews.model';
import { fetchPlaceReviews } from '../../lib/api/reviews/fetchPlaceReviews';
import { sharePlace } from './sharePlace';

const PHOTO_CONTRIBUTION_COLLECTIONS: ReadonlyArray<MapPlaceCollection> = ['kiosks', 'markets'];

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
  const [loved, setLoved] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [focusedNoticeId, setFocusedNoticeId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
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

  const shellInteraction = shellSnapshot?.interaction;

  const applyLoaded = useCallback(
    (loadedPlace: MapPlaceRecord, loadedReviews: PlaceDetailReviewRow[]) => {
      const loadedInteraction = loadedPlace.interaction;
      const preferShell =
        !!shellInteraction &&
        (!loadedInteraction || loadedInteraction.reason === 'auth_required');
      const placeWithInteraction: MapPlaceRecord = preferShell
        ? { ...loadedPlace, interaction: shellInteraction }
        : loadedPlace;
      setPlace(placeWithInteraction);
      setReviews(loadedReviews);
      setError(null);
      setCachedPlaceDetail(collection, id, {
        place: placeWithInteraction,
        reviews: loadedReviews,
      });
    },
    [collection, id, shellInteraction],
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
      } catch {
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
      // Always revalidate — interaction flags (canFavorite) must not stay stale.
      void loadFresh(true);
      return;
    }

    logPlaceDetailCacheAccess(collection, id, false);
    await loadFresh(false);
  }, [applyLoaded, collection, id, loadFresh]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!user) {
        setLoved(false);
        return;
      }
      const full = await fetchCurrentUserFull(0);
      if (cancelled || !full) {
        return;
      }
      setLoved(isPlaceInFavorites(full, collection, id));
    })();
    return () => {
      cancelled = true;
    };
  }, [collection, id, user]);

  const card = useMemo(() => {
    if (!place || !serverOrigin) {
      return null;
    }
    const mapped = mapPayloadListingToMapCard(place, serverOrigin, referenceLngLat);
    return { ...mapped, loved };
  }, [loved, place, referenceLngLat, serverOrigin]);

  const photoUrls = useMemo(() => {
    if (!place || !serverOrigin) {
      if (shellSnapshot?.imageUrl) {
        return [shellSnapshot.imageUrl];
      }
      return [];
    }
    return resolveHeroPhotoUrls(place, serverOrigin, card?.imageUrl);
  }, [card?.imageUrl, place, serverOrigin, shellSnapshot?.imageUrl]);

  const listingLngLat = place ? resolvePlaceLngLat(place) : null;
  const notices = useMemo(() => (place ? buildPlaceDetailNotices(place, t) : []), [place, t]);

  const onSharePress = useCallback(() => {
    if (!place) {
      return;
    }
    void sharePlace({
      name: place.name,
      collection,
      placeId: id,
    });
  }, [collection, id, place]);

  const canFavoritePlace = place?.interaction?.canFavorite === true;

  const runSaveToggle = useCallback(() => {
    if (!user) {
      return;
    }
    void (async () => {
      setSaveBusy(true);
      try {
        const result = await toggleFavoritePlace({
          userId: user.id,
          collection,
          placeId: id,
        });
        setLoved(result.loved);
      } catch {
        Alert.alert(t('listing.saveFailedTitle'), t('listing.saveFailedDescription'));
      } finally {
        setSaveBusy(false);
      }
    })();
  }, [collection, id, t, user]);

  const onSavePress = useCallback(() => {
    if (!place || saveBusy) {
      return;
    }
    if (canFavoritePlace) {
      runMapProtectedAction({
        user,
        allowed: true,
        t,
        onAllowed: runSaveToggle,
      });
      return;
    }
    // Stale cache / pre-auth nearby shell can lie — revalidate once before blocking.
    void (async () => {
      const loaded = await loadPlaceDetailWithReviews({
        collection,
        id,
        locale,
        serverOrigin,
      });
      if (!loaded) {
        runMapProtectedAction({ user, allowed: false, t, onAllowed: runSaveToggle });
        return;
      }
      applyLoaded(loaded.place, loaded.reviews);
      const allowed = loaded.place.interaction?.canFavorite === true;
      runMapProtectedAction({
        user,
        allowed,
        t,
        onAllowed: runSaveToggle,
      });
    })();
  }, [
    applyLoaded,
    canFavoritePlace,
    collection,
    id,
    locale,
    place,
    runSaveToggle,
    saveBusy,
    serverOrigin,
    t,
    user,
  ]);

  const onLeaveReviewPress = useCallback(() => {
    if (!user) {
      return;
    }
    setReviewError(null);
    setReviewOpen(true);
  }, [user]);

  const onSubmitReview = useCallback(
    (payload: { rating: number; description: string }) => {
      if (!user) {
        return;
      }
      void (async () => {
        setReviewSubmitting(true);
        setReviewError(null);
        try {
          await createPlaceReview({
            userId: user.id,
            collection,
            placeId: id,
            rating: payload.rating,
            description: payload.description,
          });
          if (!serverOrigin) {
            throw new Error('Missing server origin');
          }
          const fresh = await fetchPlaceReviews(collection, id);
          setReviews(mapReviewsToPlaceDetailRows(fresh, serverOrigin, locale));
          setReviewOpen(false);
        } catch {
          setReviewError(t('listing.reviewFailedDescription'));
        } finally {
          setReviewSubmitting(false);
        }
      })();
    },
    [collection, id, locale, serverOrigin, t, user],
  );

  const canAddPhoto = PHOTO_CONTRIBUTION_COLLECTIONS.includes(collection);

  const onAddPhotoPress = useCallback(() => {
    if (!user || !canAddPhoto || !canFavoritePlace) {
      return;
    }
    void (async () => {
      try {
        const ImagePicker = await import('expo-image-picker');
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(t('listing.addPhotoPermissionTitle'), t('listing.addPhotoPermissionDescription'));
          return;
        }
        const picked = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.85,
          allowsMultipleSelection: false,
        });
        if (picked.canceled || !picked.assets[0]) {
          return;
        }
        const asset = picked.assets[0];
        const name = asset.fileName ?? `place-photo-${Date.now()}.jpg`;
        const type = asset.mimeType ?? 'image/jpeg';
        await contributePlacePhoto({
          collection,
          placeId: id,
          file: { uri: asset.uri, name, type },
        });
        Alert.alert(t('listing.addPhotoSuccessTitle'), t('listing.addPhotoSuccessDescription'));
      } catch {
        Alert.alert(t('listing.addPhotoFailedTitle'), t('listing.addPhotoFailedDescription'));
      }
    })();
  }, [canAddPhoto, canFavoritePlace, collection, id, t, user]);

  const onNoticePress = useCallback((noticeId: string) => {
    setFocusedNoticeId(noticeId);
    setNoticesOpen(true);
  }, []);

  const onSeeAllNoticesPress = useCallback(() => {
    setFocusedNoticeId(null);
    setNoticesOpen(true);
  }, []);

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
    <>
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
        onSharePress={onSharePress}
        onSavePress={onSavePress}
        loved={loved}
        reviews={reviews}
        user={user}
        onLeaveReviewPress={onLeaveReviewPress}
        canAddPhoto={canAddPhoto}
        addPhotoEnabled={!!user && canFavoritePlace}
        onAddPhotoPress={onAddPhotoPress}
        onNoticePress={onNoticePress}
        onSeeAllNoticesPress={onSeeAllNoticesPress}
        t={t}
      />
      <PlaceDetailNoticesSheet
        isOpen={noticesOpen}
        onOpenChange={setNoticesOpen}
        notices={notices}
        focusedNoticeId={focusedNoticeId}
        t={t}
      />
      <PlaceDetailLeaveReviewSheet
        isOpen={reviewOpen}
        onOpenChange={setReviewOpen}
        submitting={reviewSubmitting}
        errorMessage={reviewError}
        t={t}
        onSubmit={onSubmitReview}
      />
    </>
  );
}
