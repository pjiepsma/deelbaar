import { useState } from 'react';
import { Text, View } from 'react-native';

import { FieldError, Surface, Switch } from 'heroui-native';

import { useAuth } from '../../../context/AuthContext';
import { useLocale } from '../../../context/LocaleContext';
import { updateUser } from '../../../lib/api/auth/authClient';
import { ACCOUNT_CARD_RADIUS } from '../design/accountTheme';
import { useRequireAccountUser } from '../useRequireAccountUser';
import { TestId } from '../../../testing/testIds';
import { AccountTaskScreen } from './AccountTaskScreen';

type PrefKey = 'photoRequests' | 'statusUpdates' | 'reviews' | 'favorites';

const PREF_ROWS: readonly { key: PrefKey }[] = [
  { key: 'photoRequests' },
  { key: 'statusUpdates' },
  { key: 'reviews' },
  { key: 'favorites' },
];

export function AlertsScreen() {
  const user = useRequireAccountUser();
  const { refreshUser } = useAuth();
  const { t } = useLocale();
  const [prefs, setPrefs] = useState({
    photoRequests: user?.notificationSettings?.photoRequests !== false,
    statusUpdates: user?.notificationSettings?.statusUpdates !== false,
    reviews: user?.notificationSettings?.reviews !== false,
    favorites: user?.notificationSettings?.favorites !== false,
  });
  const [savingKey, setSavingKey] = useState<PrefKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const onToggle = async (key: PrefKey, value: boolean): Promise<void> => {
    const previous = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSavingKey(key);
    setError(null);
    try {
      await updateUser(user.id, { notificationSettings: next });
      await refreshUser();
    } catch (e) {
      setPrefs(previous);
      setError(e instanceof Error ? e.message : t('account.alerts.saveFailed'));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <AccountTaskScreen
      testID={TestId.screenAccountAlerts} title={t('account.alerts.title')} subtitle={t('account.alerts.subtitle')}>
      <Surface
        className="bg-surface"
        style={{ borderRadius: ACCOUNT_CARD_RADIUS, paddingHorizontal: 16, paddingVertical: 8 }}
      >
        {PREF_ROWS.map((row) => (
          <View key={row.key} className="flex-row items-center justify-between gap-3 py-3">
            <Text className="text-foreground min-w-0 flex-1 text-base">
              {t(`account.alerts.${row.key}`)}
            </Text>
            <Switch
              isSelected={prefs[row.key]}
              isDisabled={savingKey !== null}
              onSelectedChange={(value) => void onToggle(row.key, value)}
            />
          </View>
        ))}
      </Surface>
      {error ? <FieldError>{error}</FieldError> : null}
    </AccountTaskScreen>
  );
}
