import { useState } from 'react';
import { Text } from 'react-native';

import { Button, FieldError, Input, Label, TextField } from 'heroui-native';

import { useAuth } from '../../../context/AuthContext';
import { useLocale } from '../../../context/LocaleContext';
import { updateUser } from '../../../lib/api/auth/authClient';
import { useRequireAccountUser } from '../useRequireAccountUser';
import { TestId } from '../../../testing/testIds';
import { AccountTaskScreen } from './AccountTaskScreen';

export function IdentityScreen() {
  const user = useRequireAccountUser();
  const { refreshUser } = useAuth();
  const { t } = useLocale();
  const [name, setName] = useState(user?.name ?? '');
  const [surname, setSurname] = useState(user?.surname ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const onSave = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateUser(user.id, {
        name: name.trim() || null,
        surname: surname.trim() || null,
      });
      await refreshUser();
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('account.identity.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountTaskScreen
      testID={TestId.screenAccountIdentity} title={t('account.identity.title')} subtitle={t('account.identity.subtitle')}>
      <Text className="text-muted text-sm">{t('account.identity.emailLabel')}: {user.email}</Text>
      <TextField>
        <Label>{t('account.identity.firstName')}</Label>
        <Input value={name} onChangeText={setName} autoCapitalize="words" />
      </TextField>
      <TextField>
        <Label>{t('account.identity.lastName')}</Label>
        <Input value={surname} onChangeText={setSurname} autoCapitalize="words" />
      </TextField>
      {error ? <FieldError>{error}</FieldError> : null}
      {saved ? <Text className="text-success text-sm">{t('account.identity.saved')}</Text> : null}
      <Button variant="primary" onPress={() => void onSave()} isDisabled={saving}>
        <Button.Label>{saving ? t('account.identity.saving') : t('account.identity.save')}</Button.Label>
      </Button>
    </AccountTaskScreen>
  );
}
