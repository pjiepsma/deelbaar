import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Card, Skeleton, useThemeColor } from 'heroui-native';
import { useCallback, useMemo, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';

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
import { fetchCurrentUserFull } from '../../lib/api/users/fetchCurrentUserFull';
import { navigateToAuthStart } from '../../navigation/rootNavigation';
import type { User } from '../../lib/types/payload-generated';
import { buildMapPlaceKindLabel } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import { CARD_IMAGE_HEIGHT } from '../map/map.constants';
import { mapPayloadListingToMapCard, sortMapCardsByDistance } from '../map/mapListing.mapper';
import type { MapPlaceRecord } from '../map/map.types';

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

export function SavedScreen() {
  const { referenceLngLat } = useDiscoveryArea();
  const { user } = useAuth();
  const { t } = useLocale();
  const listingPlaceholderBg = useThemeColor('muted');
  const muted = useThemeColor('muted');
  const serverOrigin = process.env.EXPO_PUBLIC_PAYLOAD_SERVER_URL;
  const [rawSaved, setRawSaved] = useState<MapPlaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cards = useMemo(() => {
    if (!serverOrigin) {
      return [];
    }
    const mapped = rawSaved.map((listing) => mapPayloadListingToMapCard(listing, serverOrigin, referenceLngLat));
    return sortMapCardsByDistance(mapped);
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
    } catch (e) {
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
      <Screen withTabBarSpacing horizontalPadding={TAB_SCREEN_HORIZONTAL_PADDING}>
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
    <Screen withTabBarSpacing horizontalPadding={TAB_SCREEN_HORIZONTAL_PADDING}>
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
          cards.map((item) => (
            <Card key={item.id != null ? `${item.mapPlaceCollection}-${String(item.id)}` : item.title}>
              <Card.Body style={{ gap: 8 }}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: '100%', height: CARD_IMAGE_HEIGHT, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: '100%',
                      height: CARD_IMAGE_HEIGHT,
                      borderRadius: 12,
                      backgroundColor: listingPlaceholderBg,
                    }}
                  />
                )}
                <Card.Title>{item.title}</Card.Title>
                <Card.Description>{buildMapPlaceKindLabel(item, t)}</Card.Description>
                {item.distanceKm !== undefined ? (
                  <Card.Description>
                    {t('favorites.distanceFromMap', { km: item.distanceKm.toFixed(1) })}
                  </Card.Description>
                ) : null}
              </Card.Body>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
