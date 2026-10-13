import { useState } from 'react';
import { Text } from 'react-native';

import { Button, Card, FieldError, Input, Label, TextField } from 'heroui-native';

import { useAuth } from '../../../context/AuthContext';
import { useLocale } from '../../../context/LocaleContext';
import { updateUser } from '../../../lib/api/auth/authClient';
import { ACCOUNT_CARD_RADIUS } from '../design/accountTheme';
import { useRequireAccountUser } from '../useRequireAccountUser';
import { TestId } from '../../../testing/testIds';
import { AccountTaskScreen } from './AccountTaskScreen';

export function HomeBaseScreen() {
  const user = useRequireAccountUser();
  const { refreshUser } = useAuth();
  const { t } = useLocale();
  const [city, setCity] = useState(user?.homeArea?.city ?? '');
  const [province, setProvince] = useState(user?.homeArea?.province ?? '');
  const [country, setCountry] = useState(user?.homeArea?.country ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const onSave = async (): Promise<void> => {
    const trimmedCity = city.trim();
    if (!trimmedCity) {
      setError(t('account.homeBase.cityRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateUser(user.id, {
        homeArea: {
          city: trimmedCity,
          province: province.trim() || null,
          country: country.trim() || null,
        },
      });
      await refreshUser();
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('account.homeBase.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountTaskScreen
      testID={TestId.screenAccountHomeBase} title={t('account.homeBase.title')} subtitle={t('account.homeBase.subtitle')}>
      <Card variant="secondary" style={{ borderRadius: ACCOUNT_CARD_RADIUS }}>
        <Card.Body>
          <Card.Description>{t('account.homeBase.why')}</Card.Description>
        </Card.Body>
      </Card>
      <TextField>
        <Label>{t('account.homeBase.city')}</Label>
        <Input value={city} onChangeText={setCity} />
      </TextField>
      <TextField>
        <Label>{t('account.homeBase.province')}</Label>
        <Input value={province} onChangeText={setProvince} />
      </TextField>
      <TextField>
        <Label>{t('account.homeBase.country')}</Label>
        <Input value={country} onChangeText={setCountry} />
      </TextField>
      {error ? <FieldError>{error}</FieldError> : null}
      {saved ? <Text className="text-success text-sm">{t('account.homeBase.saved')}</Text> : null}
      <Button variant="primary" onPress={() => void onSave()} isDisabled={saving}>
        <Button.Label>{saving ? t('account.homeBase.saving') : t('account.homeBase.save')}</Button.Label>
      </Button>
    </AccountTaskScreen>
  );
}
