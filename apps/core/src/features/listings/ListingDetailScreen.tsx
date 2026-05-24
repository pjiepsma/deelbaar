import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Button, Card, Spinner, useThemeColor } from 'heroui-native';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../auth/auth.types';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useDiscoveryArea } from '../../context/DiscoveryAreaContext';
import { getPayloadSdk } from '../../lib/api/payloadSdk';
import { buildMapPlaceKindLabel } from '../../lib/mapPlaces/mapPlaceTaxonomy';
import { mapPayloadListingToMapCard } from '../map/mapListing.mapper';
import type { MapPlaceRecord } from '../map/map.types';

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
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLocale();
  const { referenceLngLat } = useDiscoveryArea();
  const muted = useThemeColor('muted');
  const serverOrigin = process.env.EXPO_PUBLIC_PAYLOAD_SERVER_URL;

  const { collection, id } = route.params;

  const [place, setPlace] = useState<MapPlaceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('listing.detailTitle') });
  }, [navigation, t]);

  const load = useCallback(async () => {
    if (!user) {
      setError(t('listing.signInToViewDetails'));
      setPlace(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sdk = getPayloadSdk();
      const doc = await sdk.findByID({
        collection,
        id,
        depth: 1,
      });
      const mapped = toMapPlaceRecord(doc, collection);
      if (!mapped) {
        setError(t('listing.notFound'));
        setPlace(null);
        return;
      }
      setPlace(mapped);
    } catch (e) {
      const message = e instanceof Error ? e.message : t('listing.couldNotLoad');
      setError(message);
      setPlace(null);
    } finally {
      setLoading(false);
    }
  }, [collection, id, user, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const imageUrl =
    place && serverOrigin ? mapPayloadListingToMapCard(place, serverOrigin, referenceLngLat).imageUrl : undefined;

  if (!user) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
        <Button variant="ghost" onPress={() => navigation.goBack()}>
          <Button.Label>{t('listing.back')}</Button.Label>
        </Button>
        <Card className="mt-4">
          <Card.Body>
            <Card.Title>{t('listing.signInRequiredTitle')}</Card.Title>
            <Card.Description>{t('listing.signInRequiredDescription')}</Card.Description>
          </Card.Body>
        </Card>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  if (error || !place) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
        <Button variant="ghost" onPress={() => navigation.goBack()}>
          <Button.Label>{t('listing.back')}</Button.Label>
        </Button>
        <Card className="mt-4">
          <Card.Body>
            <Card.Title>{t('listing.unavailableTitle')}</Card.Title>
            <Card.Description>{error ?? t('listing.unknownError')}</Card.Description>
          </Card.Body>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width: '100%', height: 220, borderRadius: 12 }} resizeMode="cover" />
      ) : (
        <View style={{ height: 220, borderRadius: 12, backgroundColor: muted }} />
      )}

      <Text className="text-foreground mt-4 text-2xl font-semibold">{place.name}</Text>
      <Text className="text-muted mt-1 text-sm">{buildMapPlaceKindLabel(place)}</Text>

      <Text className="text-foreground mt-4 text-base leading-6">{place.description}</Text>
    </ScrollView>
  );
}
