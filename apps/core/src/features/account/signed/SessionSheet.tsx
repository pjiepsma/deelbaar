import Constants from 'expo-constants';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { BottomSheet, Button } from 'heroui-native';

import { useAuth } from '../../../context/AuthContext';
import { useLocale } from '../../../context/LocaleContext';

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SessionSheet({ isOpen, onOpenChange }: Props) {
  const { t } = useLocale();
  const { signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion;

  const onLogout = (): void => {
    setLoggingOut(true);
    void signOut().finally(() => {
      setLoggingOut(false);
      onOpenChange(false);
    });
  };

  const onDeleteAccount = (): void => {
    Alert.alert(t('account.session.deleteTitle'), t('account.session.deleteBody'), [
      { text: t('account.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <BottomSheet.Close />
          <BottomSheet.Title>{t('account.session.title')}</BottomSheet.Title>
          <View style={{ gap: 12 }}>
            <Button variant="danger" onPress={onLogout} isDisabled={loggingOut}>
              <Button.Label>
                {loggingOut ? t('account.session.loggingOut') : t('account.session.logout')}
              </Button.Label>
            </Button>
            <Button variant="ghost" onPress={onDeleteAccount}>
              <Button.Label>{t('account.session.deleteAccount')}</Button.Label>
            </Button>
            {appVersion ? (
              <Text className="text-muted text-xs">
                {t('account.session.version', { version: String(appVersion) })}
              </Text>
            ) : null}
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
