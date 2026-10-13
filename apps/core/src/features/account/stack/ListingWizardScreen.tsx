import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { Card, Chip, FieldError, Input, Label, TextField } from 'heroui-native';
import { Stepper } from 'heroui-native-pro/stepper';

import { useLocale } from '../../../context/LocaleContext';
import { createMapPlace, updateMapPlace } from '../../../lib/api/listings/listingsMutations';
import { fetchMyListings } from '../../../lib/api/listings/fetchMyListings';
import {
  defaultSubtypeForCollection,
  mapPlaceFilterLabel,
  subtypeOptionsForCollection,
  type MapPlaceCollection,
} from '../../../lib/mapPlaces/mapPlaceTaxonomy';
import { AccountPath } from '../../../navigation/accountPaths';
import { navigateToAccountPath } from '../../../navigation/rootNavigation';
import type { MapPlaceRecord } from '../../map/map.types';
import { getHostAttestationComplete } from '../hostAttestation.storage';
import {
  isMapPlaceCollection,
  kindFieldsForSave,
  LISTING_COLLECTION_ROW,
} from '../listingEditor.helpers';
import { useRequireAccountUser } from '../useRequireAccountUser';
import { TestId } from '../../../testing/testIds';
import { AccountTaskScreen } from './AccountTaskScreen';
import { StickyActionBar } from '../design/StickyActionBar';

type Props = {
  mode: 'create' | 'edit';
};

const WIZARD_STEPS = ['name', 'description', 'type', 'visibility', 'review'] as const;
type WizardStep = (typeof WIZARD_STEPS)[number];

const STEP_INDEX: Record<WizardStep, number> = {
  name: 0,
  description: 1,
  type: 2,
  visibility: 3,
  review: 4,
};

export function ListingWizardScreen({ mode }: Props) {
  const user = useRequireAccountUser();
  const { t } = useLocale();
  const router = useRouter();
  const params = useLocalSearchParams<{ collection?: string; id?: string }>();

  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<WizardStep>('name');
  const [editingPlace, setEditingPlace] = useState<MapPlaceRecord | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [collection, setCollection] = useState<MapPlaceCollection>('kiosks');
  const [subtype, setSubtype] = useState<string>(() => defaultSubtypeForCollection('kiosks'));
  const [publishStatus, setPublishStatus] = useState<'draft' | 'live'>('draft');

  useEffect(() => {
    if (mode !== 'edit' || !user) return;
    const collectionParam = params.collection;
    const idParam = params.id;
    if (!collectionParam || !idParam || !isMapPlaceCollection(collectionParam)) {
      setError(t('account.wizard.invalidRoute'));
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const docs = await fetchMyListings(user.id);
        const match = docs.find(
          (doc) => doc.mapPlaceCollection === collectionParam && String(doc.id) === String(idParam),
        );
        if (!match) {
          setError(t('account.wizard.notFound'));
          setLoading(false);
          return;
        }
        setEditingPlace(match);
        setCollection(match.mapPlaceCollection);
        setName(match.name);
        setDescription(match.description);
        if (match.mapPlaceCollection === 'kiosks') {
          if (!match.kioskSubtype) throw new Error(`Place ${String(match.id)} missing kioskSubtype`);
          setSubtype(match.kioskSubtype);
        } else if (match.mapPlaceCollection === 'markets') {
          if (!match.marketSubtype) throw new Error(`Place ${String(match.id)} missing marketSubtype`);
          setSubtype(match.marketSubtype);
        } else {
          if (!match.tapSubtype) throw new Error(`Place ${String(match.id)} missing tapSubtype`);
          setSubtype(match.tapSubtype);
        }
        if (match.publishStatus !== 'draft' && match.publishStatus !== 'live') {
          throw new Error(`Place ${String(match.id)} missing publishStatus`);
        }
        setPublishStatus(match.publishStatus);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('account.wizard.saveFailed'));
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, params.collection, params.id, t, user]);

  const stepKeys = useMemo(
    () => ({
      name: t('account.wizard.stepName'),
      description: t('account.wizard.stepDesc'),
      type: t('account.wizard.stepType'),
      visibility: t('account.wizard.stepVisibility'),
      review: t('account.wizard.stepReview'),
    }),
    [t],
  );

  const canAdvanceName = name.trim().length > 0;
  const canAdvanceDesc = description.trim().length > 0;
  const canAdvanceType = subtype.trim().length > 0;

  const onSave = async (): Promise<void> => {
    if (!user) return;
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    if (!trimmedName) {
      setError(t('account.wizard.nameRequired'));
      setStep('name');
      return;
    }
    if (!trimmedDesc) {
      setError(t('account.wizard.descRequired'));
      setStep('description');
      return;
    }

    if (publishStatus === 'live') {
      const attested = await getHostAttestationComplete(user.id);
      if (!attested) {
        Alert.alert(t('account.wizard.attestRequiredTitle'), t('account.wizard.attestRequiredBody'), [
          { text: t('account.cancel'), style: 'cancel' },
          { text: t('account.tiles.rules'), onPress: () => navigateToAccountPath(AccountPath.guidelines) },
        ]);
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const kind = kindFieldsForSave(collection, subtype);
      const payload = { name: trimmedName, description: trimmedDesc, ...kind, publishStatus };
      if (mode === 'create') {
        await createMapPlace({ collection, data: payload });
      } else {
        if (!editingPlace) throw new Error(t('account.wizard.notFound'));
        await updateMapPlace({ collection: editingPlace.mapPlaceCollection, id: editingPlace.id, data: payload });
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('account.wizard.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const title = mode === 'create' ? t('account.wizard.newTitle') : t('account.wizard.editTitle');

  const goNext = (): void => {
    if (step === 'name') {
      if (!canAdvanceName) { setError(t('account.wizard.nameRequired')); return; }
      setError(null); setStep('description');
    } else if (step === 'description') {
      if (!canAdvanceDesc) { setError(t('account.wizard.descRequired')); return; }
      setError(null); setStep('type');
    } else if (step === 'type') {
      if (!canAdvanceType) return;
      setStep('visibility');
    } else if (step === 'visibility') {
      setStep('review');
    }
  };

  const goBack = (): void => {
    if (step === 'description') setStep('name');
    else if (step === 'type') setStep('description');
    else if (step === 'visibility') setStep('type');
    else if (step === 'review') setStep('visibility');
  };

  const isLastStep = step === 'review';

  return (
    <AccountTaskScreen
      testID={TestId.screenAccountListingWizard}
      title={title}
      scroll={false}
      stickyBottom={
        <StickyActionBar
          primaryLabel={isLastStep ? (saving ? t('account.wizard.saving') : t('account.wizard.save')) : t('account.wizard.continue')}
          onPrimary={isLastStep ? () => void onSave() : goNext}
          secondaryLabel={step !== 'name' ? t('account.back') : t('account.cancel')}
          onSecondary={step !== 'name' ? goBack : () => router.back()}
          isPending={saving}
        />
      }
    >
      {loading ? (
        <Text className="text-muted text-base">{t('account.wizard.saving')}</Text>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Stepper orientation="horizontal" currentStep={STEP_INDEX[step]}>
            {WIZARD_STEPS.map((key) => (
              <Stepper.Step key={key}>
                <Stepper.Rail />
                <Stepper.Content>
                  <Stepper.Title>{stepKeys[key]}</Stepper.Title>
                </Stepper.Content>
              </Stepper.Step>
            ))}
          </Stepper>

          {error ? <FieldError>{error}</FieldError> : null}

          {step === 'name' ? (
            <TextField>
              <Label>{t('account.wizard.fieldName')}</Label>
              <Input
                value={name}
                onChangeText={setName}
                placeholder={t('account.wizard.fieldNamePlaceholder')}
              />
            </TextField>
          ) : null}

          {step === 'description' ? (
            <TextField>
              <Label>{t('account.wizard.fieldDescription')}</Label>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder={t('account.wizard.fieldDescriptionPlaceholder')}
                multiline
              />
            </TextField>
          ) : null}

          {step === 'type' ? (
            <>
              <Text className="text-foreground font-semibold">{t('account.wizard.fieldCollection')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {LISTING_COLLECTION_ROW.map((value) => (
                    <Chip
                      key={value}
                      variant={collection === value ? 'primary' : 'secondary'}
                      onPress={() => { setCollection(value); setSubtype(defaultSubtypeForCollection(value)); }}
                    >
                      <Chip.Label>{mapPlaceFilterLabel(value, t)}</Chip.Label>
                    </Chip>
                  ))}
                </View>
              </ScrollView>
              <Text className="text-foreground font-semibold">{t('account.wizard.fieldSubtype')}</Text>
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
            </>
          ) : null}

          {step === 'visibility' ? (
            <>
              <Text className="text-foreground font-semibold">{t('account.wizard.fieldVisibility')}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Chip
                  variant={publishStatus === 'draft' ? 'primary' : 'secondary'}
                  onPress={() => setPublishStatus('draft')}
                >
                  <Chip.Label>{t('account.wizard.visibilityDraft')}</Chip.Label>
                </Chip>
                <Chip
                  variant={publishStatus === 'live' ? 'primary' : 'secondary'}
                  onPress={() => setPublishStatus('live')}
                >
                  <Chip.Label>{t('account.wizard.visibilityLive')}</Chip.Label>
                </Chip>
              </View>
            </>
          ) : null}

          {step === 'review' ? (
            <Card>
              <Card.Body style={{ gap: 8 }}>
                <Card.Title>{name}</Card.Title>
                <Card.Description>{description}</Card.Description>
                <Chip variant={publishStatus === 'live' ? 'primary' : 'secondary'}>
                  <Chip.Label>
                    {publishStatus === 'live' ? t('account.wizard.visibilityLive') : t('account.wizard.visibilityDraft')}
                  </Chip.Label>
                </Chip>
              </Card.Body>
            </Card>
          ) : null}
        </ScrollView>
      )}
    </AccountTaskScreen>
  );
}
