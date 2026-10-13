import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, View } from 'react-native';

import { ControlField, Description, Label, Surface } from 'heroui-native';

import { useLocale } from '../../../context/LocaleContext';
import { ACCOUNT_CARD_RADIUS } from '../design/accountTheme';
import { TestId } from '../../../testing/testIds';
import { AccountTaskScreen } from './AccountTaskScreen';

type LocationAccess = 'granted' | 'denied' | 'undetermined' | 'disabled';

async function readLocationAccess(): Promise<LocationAccess> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    return 'disabled';
  }
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status === Location.PermissionStatus.GRANTED) {
    return 'granted';
  }
  if (status === Location.PermissionStatus.DENIED) {
    return 'denied';
  }
  return 'undetermined';
}

export function LocationServicesScreen() {
  const { t } = useLocale();
  const [access, setAccess] = useState<LocationAccess | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setAccess(await readLocationAccess());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const isOn = access === 'granted';

  const onToggle = async (nextOn: boolean): Promise<void> => {
    if (busy || access === null) {
      return;
    }
    setBusy(true);
    try {
      if (nextOn) {
        if (access === 'undetermined') {
          await Location.requestForegroundPermissionsAsync();
          await refresh();
          return;
        }
        await Linking.openSettings();
        return;
      }
      await Linking.openSettings();
    } finally {
      setBusy(false);
    }
  };

  const statusDescription =
    access === null
      ? undefined
      : isOn
        ? t('account.guest.locationOn')
        : t('account.guest.locationOff');

  return (
    <AccountTaskScreen
      testID={TestId.screenAccountLocation} title={t('account.location.title')} subtitle={t('account.location.subtitle')}>
      <Surface
        className="bg-surface"
        style={{ borderRadius: ACCOUNT_CARD_RADIUS, paddingHorizontal: 16, paddingVertical: 8 }}
      >
        <ControlField
          isSelected={isOn}
          isDisabled={busy || access === null}
          onSelectedChange={(value) => void onToggle(value)}
        >
          <View className="min-w-0 flex-1">
            <Label>{t('account.location.toggleLabel')}</Label>
            {statusDescription ? <Description>{statusDescription}</Description> : null}
          </View>
          <ControlField.Indicator />
        </ControlField>
      </Surface>
    </AccountTaskScreen>
  );
}
