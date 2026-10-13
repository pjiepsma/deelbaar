import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Button, Card, PressableFeedback, Skeleton, useThemeColor } from 'heroui-native';
import { useCallback, useMemo, useState } from 'react';
import { Alert as NativeAlert, Image, ScrollView, View, type GestureResponderEvent } from 'react-native';

import {
  EmptyList,
  GuestAuthCard,
  Screen,
  TAB_SCREEN_CONTENT_BOTTOM_PADDING,
  TAB_SCREEN_HEADER_TOP_GAP,
  TAB_SCREEN_HORIZONTAL_PADDING,
  TAB_SCREEN_SECTION_GAP,
  TabScreenHeader,
} from '../../components/shared';
import { useAuth } from '../../context/AuthContext';
import { useDiscoveryArea } from '../../context/DiscoveryAreaContext';
import { useLocale } from '../../context/LocaleContext';
import { toggleFavoritePlace } from '../../lib/api/favorites/toggleFavorite';
import { fetchCurrentUserFull } from '../../lib/api/users/fetchCurrentUserFull';
import { setPlaceDetailShellSnapshot } from '../../lib/listings/placeDetailNavigationShell';
import type { User } from '../../lib/types/payload-generated';
import { buildMapPlaceKindLabel } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import { navigateToAuthStart, navigateToListingDetail } from '../../navigation/rootNavigation';
import { TestId } from '../../testing/testIds';
import {
  CARD_IMAGE_HEIGHT,
  MAP_LISTING_HEART_SIZE,
  MAP_LISTING_THUMB_OVERLAY_INSET,
} from '../map/map.constants';
import { mapPayloadListingToMapCard, sortMapCardsByDistance } from '../map/mapListing.mapper';
import type { MapListingCard, MapPlaceRecord } from '../map/map.types';

const LIST_GAP = 12;

function isMapPlaceRecord(value: unknown): value is MapPlaceRecord {
  return (
    !!value &&
    typeof value === 'object' &&
    'id' in value &&
    'name' in value &&
    'mapPlaceCollection' in value
  );
}

function listingsFromFavorites(user: User): MapPlaceRecord[] {
  const rows = user.favorites;
  if (!rows || rows.length === 0) {
    return [];
  }
  const out: MapPlaceRecord[] = [];
  for (const row of rows) {
    const place = row.place;
    if (
      place &&
      typeof place === 'object' &&
      'relationTo' in place &&
      'value' in place &&
      typeof (place as { relationTo?: unknown }).relationTo === 'string'
    ) {
      const relationTo = (place as { relationTo: string }).relationTo;
      if (relationTo !== 'kiosks' && relationTo !== 'markets' && relationTo !== 'taps') {
        continue;
      }
      const value = (place as { value?: unknown }).value;
      if (value && typeof value === 'object' && 'id' in value && 'name' in value) {
        out.push({
          ...(value as MapPlaceRecord),
          mapPlaceCollection: relationTo,
        });
        continue;
      }
    }
    if (isMapPlaceRecord(place)) {
      out.push(place);
    }
  }
  return out;
}

function cardListKey(card: MapListingCard): string | null {
  if (card.id == null) {
    return null;
  }
  return `${card.mapPlaceCollection}-${String(card.id)}`;
}

export function SavedScreen() {
  const { referenceLngLat } = useDiscoveryArea();
  const { user } = useAuth();
  const { t } = useLocale();
  const [foregroundColor, muted] = useThemeColor(['foreground', 'muted']);
  const listingPlaceholderBg = muted;
  const serverOrigin = process.env.EXPO_PUBLIC_PAYLOAD_SERVER_URL;
  const [rawSaved, setRawSaved] = useState<MapPlaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const cards = useMemo(() => {
    if (!serverOrigin) {
      return [];
    }
    const mapped = rawSaved.map((listing) =>
      mapPayloadListingToMapCard(listing, serverOrigin, referenceLngLat),
    );
    return sortMapCardsByDistance(mapped).map((card) => ({ ...card, loved: true }));
  }, [rawSaved, serverOrigin, referenceLngLat]);

  const load = useCallback(async () => {
    if (!serverOrigin) {
      setError(t('favorites.errorMissingServer'));
      setLoading(false);
      setRawSaved([]);
      return;
    }
    if (!user) {
      setLoading(false);
      setError(null);
      setRawSaved([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const full = await fetchCurrentUserFull(2);
      if (!full) {
        setError(t('favorites.errorCouldNotLoad'));
        setRawSaved([]);
        return;
      }
      setRawSaved(listingsFromFavorites(full));
    } catch {
      setError(t('favorites.errorFailedToLoad'));
      setRawSaved([]);
    } finally {
      setLoading(false);
    }
  }, [serverOrigin, user, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openDetail = useCallback((card: MapListingCard) => {
    const cardId = typeof card.id === 'number' ? card.id : Number(card.id);
    if (!Number.isFinite(cardId)) {
      return;
    }
    setPlaceDetailShellSnapshot(card);
    navigateToListingDetail({
      collection: card.mapPlaceCollection,
      id: cardId,
    });
  }, []);

  const removeFavorite = useCallback(
    (card: MapListingCard) => {
      if (!user) {
        return;
      }
      const placeId = typeof card.id === 'number' ? card.id : Number(card.id);
      if (!Number.isFinite(placeId)) {
        return;
      }
      const key = cardListKey(card);
      if (!key || removingKey === key) {
        return;
      }
      setRemovingKey(key);
      void (async () => {
        try {
          const result = await toggleFavoritePlace({
            userId: user.id,
            collection: card.mapPlaceCollection,
            placeId,
          });
          if (!result.loved) {
            setRawSaved((previous) =>
              previous.filter(
                (row) => !(row.mapPlaceCollection === card.mapPlaceCollection && row.id === placeId),
              ),
            );
          }
        } catch {
          NativeAlert.alert(t('listing.saveFailedTitle'), t('listing.saveFailedDescription'));
        } finally {
          setRemovingKey(null);
        }
      })();
    },
    [removingKey, t, user],
  );

  if (!serverOrigin) {
    return (
      <Screen withTabBarSpacing horizontalPadding={TAB_SCREEN_HORIZONTAL_PADDING}>
        <View style={{ paddingTop: TAB_SCREEN_HEADER_TOP_GAP }}>
          <TabScreenHeader title={t('favorites.title')} subtitle={t('favorites.missingEnvDescription')} />
        </View>
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen
        testID={TestId.screenFavoritesGuest}
        withTabBarSpacing
        horizontalPadding={TAB_SCREEN_HORIZONTAL_PADDING}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: TAB_SCREEN_HEADER_TOP_GAP,
            gap: TAB_SCREEN_SECTION_GAP,
            paddingBottom: TAB_SCREEN_CONTENT_BOTTOM_PADDING,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <TabScreenHeader title={t('favorites.title')} subtitle={t('favorites.subtitle')} />
          <GuestAuthCard
            icon={<Ionicons name="heart-outline" size={28} color={muted} />}
            headline={t('favorites.signInTitle')}
            description={t('favorites.signInDescription')}
            ctaLabel={t('favorites.signInCta')}
            onPress={() => navigateToAuthStart()}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen
      testID={TestId.screenFavorites}
      withTabBarSpacing
      horizontalPadding={TAB_SCREEN_HORIZONTAL_PADDING}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: TAB_SCREEN_HEADER_TOP_GAP,
          gap: LIST_GAP,
          paddingBottom: TAB_SCREEN_CONTENT_BOTTOM_PADDING,
        }}
      >
        <TabScreenHeader title={t('favorites.title')} subtitle={t('favorites.listDescription')} />

        {error ? (
          <Alert status="danger">
            <Alert.Content>
              <Alert.Description accessibilityLiveRegion="polite">{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        {loading ? (
          <Card>
            <Card.Body>
              <Skeleton className="h-40 w-full rounded-lg" isLoading variant="pulse">
                <View />
              </Skeleton>
            </Card.Body>
          </Card>
        ) : cards.length === 0 ? (
          <EmptyList
            fill={false}
            icon={<Ionicons name="heart-outline" size={28} color={muted} />}
            title={t('favorites.emptyTitle')}
            description={t('favorites.emptyDescription')}
          />
        ) : (
          cards.map((item) => {
            const key = cardListKey(item) ?? item.title;
            const isRemoving = removingKey === cardListKey(item);
            return (
              <PressableFeedback key={key} onPress={() => openDetail(item)}>
                <Card className="overflow-hidden p-0">
                  <View className="relative w-full" style={{ height: CARD_IMAGE_HEIGHT }}>
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={{ width: '100%', height: CARD_IMAGE_HEIGHT }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: '100%',
                          height: CARD_IMAGE_HEIGHT,
                          backgroundColor: listingPlaceholderBg,
                        }}
                      />
                    )}
                    <View
                      style={{
                        position: 'absolute',
                        top: MAP_LISTING_THUMB_OVERLAY_INSET,
                        right: MAP_LISTING_THUMB_OVERLAY_INSET,
                        width: MAP_LISTING_HEART_SIZE,
                        height: MAP_LISTING_HEART_SIZE,
                      }}
                    >
                      <Button
                        testID={TestId.btnFavoriteRemove}
                        size="sm"
                        variant="secondary"
                        isIconOnly
                        isDisabled={isRemoving}
                        onPress={(event: GestureResponderEvent) => {
                          event.stopPropagation();
                          removeFavorite(item);
                        }}
                        accessibilityLabel={t('map.favoriteRemove')}
                        className="size-8"
                      >
                        <Ionicons name="heart" size={16} color={foregroundColor} />
                      </Button>
                    </View>
                  </View>
                  <Card.Body style={{ gap: 8 }} className="px-3 py-2.5">
                    <Card.Title>{item.title}</Card.Title>
                    <Card.Description>{buildMapPlaceKindLabel(item, t)}</Card.Description>
                    {item.distanceKm !== undefined ? (
                      <Card.Description>
                        {t('favorites.distanceFromMap', { km: item.distanceKm.toFixed(1) })}
                      </Card.Description>
                    ) : null}
                  </Card.Body>
                </Card>
              </PressableFeedback>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
