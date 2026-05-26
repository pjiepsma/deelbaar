import { useNavigation, useRoute, type NavigationProp, type ParamListBase, type RouteProp } from '@react-navigation/native';
import Mapbox from '@rnmapbox/maps';
import { Button, Spinner } from 'heroui-native';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../auth/auth.types';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useDiscoveryArea } from '../../context/DiscoveryAreaContext';
import { fetchPlaceReviews } from '../../lib/api/reviews/fetchPlaceReviews';
import { getPayloadSdk } from '../../lib/api/payloadSdk';
import { resolveDeviceLngLat } from '../../lib/location/resolveDeviceLngLat';
import { runMapProtectedAction } from '../map/mapProtectedAction';
import { mapPayloadListingToMapCard } from '../map/mapListing.mapper';
import type { MapPlaceRecord } from '../map/map.types';
import { PlaceDetailContent } from './PlaceDetailContent';
import type { PlaceDetailHeroMode } from './PlaceDetailHero';
import { resolveHeroPhotoUrls, resolvePlaceLngLat } from './placeDetail.model';
import { mapReviewsToPlaceDetailRows } from './placeDetailReviews.model';
import { showPlaceDetailContributorComingSoon } from './placeDetailActions';
import type { PlaceDetailReviewRow } from './placeDetailReviews.model';
import { PLACE_DETAIL_BG } from './placeDetail.constants';

type Route = RouteProp<RootStackParamList, 'ListingDetail'>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toMapPlaceRecord(doc: unknown, collection: MapPlaceRecord['mapPlaceCollection']): MapPlaceRecord | null {
  if (!isRecord(doc) || typeof doc.id !== 'number') {
    return null;
  }
  return {
    ...(doc as Omit<MapPlaceRecord, 'mapPlaceCollection'>),
    mapPlaceCollection: collection,
  };
}

export function ListingDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { referenceLngLat } = useDiscoveryArea();
  const serverOrigin = process.env.EXPO_PUBLIC_PAYLOAD_SERVER_URL;
  const mapboxAccessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const { collection, id } = route.params;

  const [place, setPlace] = useState<MapPlaceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroMode, setHeroMode] = useState<PlaceDetailHeroMode>('photos');
  const [userLngLat, setUserLngLat] = useState<[number, number] | null>(null);
  const [reviews, setReviews] = useState<PlaceDetailReviewRow[]>([]);
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sdk = getPayloadSdk();
      const doc = await sdk.findByID({
        collection,
        id,
        depth: 2,
      });
      const mapped = toMapPlaceRecord(doc, collection);
      if (!mapped) {
        setError(t('listing.notFound'));
        setPlace(null);
        return;
      }
      setPlace(mapped);
      if (serverOrigin) {
        try {
          const reviewDocs = await fetchPlaceReviews(collection, id);
          setReviews(mapReviewsToPlaceDetailRows(reviewDocs, serverOrigin, locale));
        } catch {
          setReviews([]);
        }
      } else {
        setReviews([]);
      }
    } catch (_e) {
      setError(t('listing.couldNotLoad'));
      setPlace(null);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [collection, id, locale, serverOrigin, t]);

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
      return [];
    }
    return resolveHeroPhotoUrls(place, serverOrigin, card.imageUrl);
  }, [card, place, serverOrigin]);

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
      navigation,
      allowed: !!place.interaction?.canFavorite,
      t,
    });
  }, [navigation, place, t, user]);

  if (loading) {
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
        <Button variant="ghost" onPress={() => navigation.goBack()}>
          <Button.Label>{t('listing.back')}</Button.Label>
        </Button>
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
      onBack={() => navigation.goBack()}
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
