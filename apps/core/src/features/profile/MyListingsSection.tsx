import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, Chip, FieldError, Input, Label, TextField } from 'heroui-native';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { useLocale } from '../../context/LocaleContext';
import {
  MAP_PLACE_FILTER_VALUES,
  defaultSubtypeForCollection,
  mapPlaceFilterLabel,
  subtypeOptionsForCollection,
  type MapPlaceCollection,
} from '../../lib/mapPlaces/mapPlaceTaxonomy';
import {
  createMapPlace,
  softDeleteMapPlace,
  updateMapPlace,
} from '../../lib/api/listings/listingsMutations';
import { fetchMyListings } from '../../lib/api/listings/fetchMyListings';
import { useDiscoveryArea } from '../../context/DiscoveryAreaContext';
import { mapPayloadListingToMapCard } from '../map/mapListing.mapper';
import type { MapPlaceRecord } from '../map/map.types';

const SECTION_GAP = 12;

const COLLECTION_ROW = MAP_PLACE_FILTER_VALUES.filter((value): value is MapPlaceCollection => value !== 'All');

function kindFieldsForSave(
  collection: MapPlaceCollection,
  subtype: string,
): {
  kioskSubtype: string | null;
  marketSubtype: string | null;
  tapSubtype: string | null;
} {
  switch (collection) {
    case 'kiosks':
      return {
        kioskSubtype: subtype,
        marketSubtype: null,
        tapSubtype: null,
      };
    case 'markets':
      return {
        kioskSubtype: null,
        marketSubtype: subtype,
        tapSubtype: null,
      };
    case 'taps':
      return {
        kioskSubtype: null,
        marketSubtype: null,
        tapSubtype: subtype,
      };
    default: {
      const exhaustiveCollection: never = collection;
      throw new Error(`Unhandled collection: ${String(exhaustiveCollection)}`);
    }
  }
}

type Props = {
  ownerId: number | string;
  serverOrigin: string;
};

export function MyListingsSection({ ownerId, serverOrigin }: Props) {
  const { t } = useLocale();
  const { referenceLngLat } = useDiscoveryArea();
  const [rows, setRows] = useState<MapPlaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<MapPlaceRecord | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [collection, setCollection] = useState<MapPlaceCollection>('kiosks');
  const [subtype, setSubtype] = useState<string>(() => defaultSubtypeForCollection('kiosks'));
  const [publishStatus, setPublishStatus] = useState<'draft' | 'live'>('draft');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await fetchMyListings(ownerId);
      setRows(docs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your listings');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const resetForm = (): void => {
    setEditingPlace(null);
    setName('');
    setDescription('');
    setCollection('kiosks');
    setSubtype(defaultSubtypeForCollection('kiosks'));
    setPublishStatus('draft');
  };

  const openCreate = (): void => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (row: MapPlaceRecord): void => {
    setEditingPlace(row);
    setCollection(row.mapPlaceCollection);
    setName(row.name);
    setDescription(row.description);
    if (row.mapPlaceCollection === 'kiosks') {
      if (!row.kioskSubtype) {
        throw new Error(`Place ${String(row.id)} is missing kioskSubtype`);
      }
      setSubtype(row.kioskSubtype);
    } else if (row.mapPlaceCollection === 'markets') {
      if (!row.marketSubtype) {
        throw new Error(`Place ${String(row.id)} is missing marketSubtype`);
      }
      setSubtype(row.marketSubtype);
    } else {
      if (!row.tapSubtype) {
        throw new Error(`Place ${String(row.id)} is missing tapSubtype`);
      }
      setSubtype(row.tapSubtype);
    }
    if (row.publishStatus !== 'draft' && row.publishStatus !== 'live') {
      throw new Error(`Place ${String(row.id)} is missing publishStatus`);
    }
    setPublishStatus(row.publishStatus);
    setFormOpen(true);
  };

  const onSave = async (): Promise<void> => {
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    if (!trimmedName || !trimmedDesc) {
      setError('Name and description are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const kind = kindFieldsForSave(collection, subtype);
      const savePayload = {
        name: trimmedName,
        description: trimmedDesc,
        ...kind,
        publishStatus,
      };

      if (!editingPlace) {
        await createMapPlace({
          collection,
          data: savePayload,
        });
      } else {
        await updateMapPlace({
          collection: editingPlace.mapPlaceCollection,
          id: editingPlace.id,
          data: savePayload,
        });
      }
      setFormOpen(false);
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onArchive = (row: MapPlaceRecord): void => {
    Alert.alert('Archive place?', `"${row.name}" will be hidden from the map.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await softDeleteMapPlace(row.mapPlaceCollection, row.id);
              await load();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Archive failed');
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={{ gap: SECTION_GAP }}>
      <Card>
        <Card.Body>
          <Card.Title>Your places</Card.Title>
          <Card.Description>Create drafts, publish when ready, or archive places you no longer want.</Card.Description>
        </Card.Body>
        <Card.Footer>
          <Button variant="primary" onPress={openCreate}>
            Add place
          </Button>
        </Card.Footer>
      </Card>

      {error ? (
        <Card variant="secondary">
          <Card.Body>
            <FieldError>{error}</FieldError>
          </Card.Body>
        </Card>
      ) : null}

      {formOpen ? (
        <Card>
          <Card.Body style={{ gap: 10 }}>
            <Card.Title>{editingPlace === null ? 'New place' : 'Edit place'}</Card.Title>
            <TextField>
              <Label>Name</Label>
              <Input value={name} onChangeText={setName} placeholder="Place name" />
            </TextField>
            <TextField>
              <Label>Description</Label>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="What can people find or do here?"
                multiline
              />
            </TextField>
            <Text style={{ fontWeight: '600' }}>Collection</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {COLLECTION_ROW.map((value) => (
                  <Chip
                    key={value}
                    variant={collection === value ? 'primary' : 'secondary'}
                    onPress={() => {
                      setCollection(value);
                      setSubtype(defaultSubtypeForCollection(value));
                    }}
                  >
                    <Chip.Label>{mapPlaceFilterLabel(value, t)}</Chip.Label>
                  </Chip>
                ))}
              </View>
            </ScrollView>
            <Text style={{ fontWeight: '600' }}>Subtype</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {subtypeOptionsForCollection(collection, t).map((opt) => (
                  <Chip
                    key={opt.value}
                    variant={subtype === opt.value ? 'primary' : 'secondary'}
                    onPress={() => setSubtype(opt.value)}
                  >
                    <Chip.Label>{opt.label}</Chip.Label>
                  </Chip>
                ))}
              </View>
            </ScrollView>
            <Text style={{ fontWeight: '600' }}>Visibility</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip variant={publishStatus === 'draft' ? 'primary' : 'secondary'} onPress={() => setPublishStatus('draft')}>
                <Chip.Label>Draft</Chip.Label>
              </Chip>
              <Chip variant={publishStatus === 'live' ? 'primary' : 'secondary'} onPress={() => setPublishStatus('live')}>
                <Chip.Label>Live</Chip.Label>
              </Chip>
            </View>
          </Card.Body>
          <Card.Footer style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="secondary" onPress={() => { setFormOpen(false); resetForm(); }} isDisabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onPress={() => void onSave()} isDisabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </Card.Footer>
        </Card>
      ) : null}

      {loading ? (
        <Card>
          <Card.Body>
            <Card.Description>Loading your listings…</Card.Description>
          </Card.Body>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <Card.Body>
            <Card.Description>No places yet. Tap “Add place” to create one.</Card.Description>
          </Card.Body>
        </Card>
      ) : (
        rows.map((row) => {
          const card = mapPayloadListingToMapCard(row, serverOrigin, referenceLngLat);
          return (
            <Card key={`${row.mapPlaceCollection}:${String(row.id)}`}>
              <Card.Body style={{ gap: 6 }}>
                <Card.Title>{row.name}</Card.Title>
                <Card.Description>
                  {row.publishStatus === 'live' ? 'Live' : 'Draft'}
                  {card.distanceKm !== undefined ? ` · ${card.distanceKm.toFixed(1)} km from map area` : ''}
                </Card.Description>
              </Card.Body>
              <Card.Footer style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Button variant="secondary" size="sm" onPress={() => openEdit(row)}>
                  Edit
                </Button>
                <Button variant="danger-soft" size="sm" onPress={() => onArchive(row)}>
                  Archive
                </Button>
              </Card.Footer>
            </Card>
          );
        })
      )}
    </View>
  );
}
