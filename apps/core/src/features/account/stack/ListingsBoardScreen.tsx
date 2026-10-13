import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button, Card, Chip, FieldError, Tabs } from 'heroui-native';

import { EmptyList } from '../../../components/shared';
import { useLocale } from '../../../context/LocaleContext';
import { useDiscoveryArea } from '../../../context/DiscoveryAreaContext';
import { softDeleteMapPlace } from '../../../lib/api/listings/listingsMutations';
import { fetchMyListings } from '../../../lib/api/listings/fetchMyListings';
import {
  navigateToAccountListingEdit,
  navigateToAccountListingNew,
} from '../../../navigation/rootNavigation';
import { mapPayloadListingToMapCard } from '../../map/mapListing.mapper';
import type { MapPlaceRecord } from '../../map/map.types';
import { useRequireAccountUser } from '../useRequireAccountUser';
import { TestId } from '../../../testing/testIds';
import { AccountTaskScreen } from './AccountTaskScreen';

const PAYLOAD_SERVER_ORIGIN = process.env.EXPO_PUBLIC_PAYLOAD_SERVER_URL;

type ListingTab = 'live' | 'draft';

function filterRows(rows: MapPlaceRecord[], tab: ListingTab): MapPlaceRecord[] {
  return rows.filter((row) => (tab === 'live' ? row.publishStatus === 'live' : row.publishStatus === 'draft'));
}

export function ListingsBoardScreen() {
  const user = useRequireAccountUser();
  const { t } = useLocale();
  const { referenceLngLat } = useDiscoveryArea();
  const [rows, setRows] = useState<MapPlaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ListingTab>('live');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const docs = await fetchMyListings(user.id);
      setRows(docs);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('account.board.loadFailed'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [t, user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onArchive = (row: MapPlaceRecord): void => {
    Alert.alert(t('account.board.archiveTitle'), t('account.board.archiveBody', { name: row.name }), [
      { text: t('account.cancel'), style: 'cancel' },
      {
        text: t('account.board.archive'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await softDeleteMapPlace(row.mapPlaceCollection, row.id);
              await load();
            } catch (e) {
              setError(e instanceof Error ? e.message : t('account.board.archiveFailed'));
            }
          })();
        },
      },
    ]);
  };

  if (!user) return null;

  if (!PAYLOAD_SERVER_ORIGIN) {
    return (
      <AccountTaskScreen testID={TestId.screenAccountListings} title={t('account.board.title')}>
        <Text className="text-muted text-base">{t('account.board.missingEnv')}</Text>
      </AccountTaskScreen>
    );
  }

  const filtered = filterRows(rows, tab);

  return (
    <AccountTaskScreen
      testID={TestId.screenAccountListings}
      title={t('account.board.title')}
      subtitle={t('account.board.subtitle')}
    >
      <Button variant="primary" onPress={() => navigateToAccountListingNew()} className="self-start">
        <Button.Label>{t('account.board.add')}</Button.Label>
      </Button>

      {error ? (
        <Card variant="secondary">
          <Card.Body>
            <FieldError>{error}</FieldError>
          </Card.Body>
        </Card>
      ) : null}

      <Tabs value={tab} onValueChange={(value) => setTab(value as ListingTab)} variant="secondary">
        <Tabs.List>
          <Tabs.Indicator />
          <Tabs.Trigger value="live">
            <Tabs.Label>{t('account.board.tabsLive')}</Tabs.Label>
          </Tabs.Trigger>
          <Tabs.Trigger value="draft">
            <Tabs.Label>{t('account.board.tabsDraft')}</Tabs.Label>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="live">
          <ListingTabBody
            loading={loading}
            rows={filtered}
            emptyTitle={t('account.board.emptyLive')}
            referenceLngLat={referenceLngLat}
            onArchive={onArchive}
            t={t}
          />
        </Tabs.Content>
        <Tabs.Content value="draft">
          <ListingTabBody
            loading={loading}
            rows={filtered}
            emptyTitle={t('account.board.emptyDraft')}
            referenceLngLat={referenceLngLat}
            onArchive={onArchive}
            t={t}
          />
        </Tabs.Content>
      </Tabs>
    </AccountTaskScreen>
  );
}

type TabBodyProps = {
  loading: boolean;
  rows: MapPlaceRecord[];
  emptyTitle: string;
  referenceLngLat: [number, number];
  onArchive: (row: MapPlaceRecord) => void;
  t: (key: string, vars?: Record<string, string>) => string;
};

function ListingTabBody({ loading, rows, emptyTitle, referenceLngLat, onArchive, t }: TabBodyProps) {
  if (loading) {
    return <Text className="text-muted text-base">{t('account.board.loadFailed')}</Text>;
  }

  if (rows.length === 0) {
    return (
      <EmptyList
        fill={false}
        icon={<Ionicons name="albums-outline" size={28} color="#888" />}
        title={emptyTitle}
        description=""
        ctaLabel={t('account.board.add')}
        onPress={() => navigateToAccountListingNew()}
      />
    );
  }

  if (!PAYLOAD_SERVER_ORIGIN) {
    throw new Error('PAYLOAD_SERVER_ORIGIN required for listing cards');
  }

  return (
    <View style={{ gap: 12 }}>
      {rows.map((row) => {
        const card = mapPayloadListingToMapCard(row, PAYLOAD_SERVER_ORIGIN, referenceLngLat);
        return (
          <Card key={`${row.mapPlaceCollection}:${String(row.id)}`}>
            <Card.Body style={{ gap: 6 }}>
              <View className="flex-row items-center justify-between gap-2">
                <Card.Title className="min-w-0 flex-1">{row.name}</Card.Title>
                <Chip variant={row.publishStatus === 'live' ? 'primary' : 'secondary'}>
                  <Chip.Label>
                    {row.publishStatus === 'live' ? t('account.board.statusLive') : t('account.board.statusDraft')}
                  </Chip.Label>
                </Chip>
              </View>
              {card.distanceKm !== undefined ? (
                <Card.Description>
                  {t('account.board.loadFailed').includes('{{km}}')
                    ? ''
                    : `${card.distanceKm.toFixed(1)} km`}
                </Card.Description>
              ) : null}
            </Card.Body>
            <Card.Footer style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => navigateToAccountListingEdit({ collection: row.mapPlaceCollection, id: row.id })}
              >
                <Button.Label>{t('account.board.edit')}</Button.Label>
              </Button>
              <Button variant="danger-soft" size="sm" onPress={() => onArchive(row)}>
                <Button.Label>{t('account.board.archive')}</Button.Label>
              </Button>
            </Card.Footer>
          </Card>
        );
      })}
    </View>
  );
}
