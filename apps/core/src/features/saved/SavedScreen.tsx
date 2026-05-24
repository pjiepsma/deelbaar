import { useFocusEffect } from '@react-navigation/native';
import { Alert, Card, Skeleton, useThemeColor } from 'heroui-native';
import { useCallback, useMemo, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';

import type { User } from '../../lib/types/payload-generated';
import { fetchCurrentUserFull } from '../../lib/api/users/fetchCurrentUserFull';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useDiscoveryArea } from '../../context/DiscoveryAreaContext';
import { CARD_IMAGE_HEIGHT } from '../map/map.constants';
import { mapPayloadListingToMapCard, sortMapCardsByDistance } from '../map/mapListing.mapper';
import type { MapPlaceRecord } from '../map/map.types';

const SCREEN_PADDING = 16;

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
      setError(e instanceof Error ? e.message : t('favorites.errorFailedToLoad'));
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
      <View style={{ flex: 1, padding: SCREEN_PADDING }}>
        <Card>
          <Card.Body>
            <Card.Title>{t('favorites.title')}</Card.Title>
            <Card.Description>{t('favorites.missingEnvDescription')}</Card.Description>
          </Card.Body>
        </Card>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, padding: SCREEN_PADDING }}>
        <Card>
          <Card.Body>
            <Card.Title>{t('favorites.signInTitle')}</Card.Title>
            <Card.Description>{t('favorites.signInDescription')}</Card.Description>
          </Card.Body>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SCREEN_PADDING, gap: 12 }}>
      <Card>
        <Card.Body>
          <Card.Title>{t('favorites.title')}</Card.Title>
          <Card.Description>{t('favorites.listDescription')}</Card.Description>
        </Card.Body>
      </Card>

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
              <Text> </Text>
            </Skeleton>
          </Card.Body>
        </Card>
      ) : cards.length === 0 ? (
        <Card>
          <Card.Body>
            <Card.Description>{t('favorites.emptyDescription')}</Card.Description>
          </Card.Body>
        </Card>
      ) : (
        cards.map((item) => (
          <Card key={item.id != null ? `${item.mapPlaceCollection}-${String(item.id)}` : item.title}>
            <Card.Body style={{ gap: 8 }}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: CARD_IMAGE_HEIGHT, borderRadius: 12 }} resizeMode="cover" />
              ) : (
                <View style={{ width: '100%', height: CARD_IMAGE_HEIGHT, borderRadius: 12, backgroundColor: listingPlaceholderBg }} />
              )}
              <Card.Title>{item.title}</Card.Title>
              <Card.Description>{item.kindLabel}</Card.Description>
              {item.distanceKm !== undefined ? (
                <Card.Description>{t('favorites.distanceFromMap', { km: item.distanceKm.toFixed(1) })}</Card.Description>
              ) : null}
            </Card.Body>
          </Card>
        ))
      )}
    </ScrollView>
  );
}
