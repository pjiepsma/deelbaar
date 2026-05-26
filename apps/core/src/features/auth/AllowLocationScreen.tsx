import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Button, Card } from 'heroui-native';
import { useState } from 'react';
import { View } from 'react-native';

import { useDiscoveryArea } from '../../context/DiscoveryAreaContext';
import { useLocale } from '../../context/LocaleContext';
import { setAuthOnboardingComplete } from '../../lib/auth/authOnboarding.storage';
import { resolveDeviceLngLat } from '../../lib/location/resolveDeviceLngLat';
import { getAuthFlowPresentation } from './authFlowPresentation';
import type { AuthStackParamList } from './auth.types';
import { dismissAuthFlow } from './auth.navigation';
import { locationErrorMessage } from '../../lib/location/locationErrorMessage';
import { AuthScreenShell } from '../../components/shared';

type Props = NativeStackScreenProps<AuthStackParamList, 'AllowLocation'>;

export function AllowLocationScreen({ navigation }: Props) {
  const { t } = useLocale();
  const { setReferenceLngLat } = useDiscoveryArea();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const finishOnboarding = async (): Promise<void> => {
    await setAuthOnboardingComplete();
    if (getAuthFlowPresentation() === 'embedded') {
      navigation.getParent()?.goBack();
      return;
    }
    dismissAuthFlow(navigation);
  };

  const onAllow = async (): Promise<void> => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const lngLat = await resolveDeviceLngLat();
      if (lngLat) {
        setReferenceLngLat(lngLat);
      }

      await finishOnboarding();
    } catch (error) {
      setErrorMessage(locationErrorMessage(error, t));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onNotNow = async (): Promise<void> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await finishOnboarding();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell title={t('auth.locationTitle')} description={t('auth.locationDescription')}>
      <Card>
        <Card.Body>
          <Card.Description>{t('auth.deviceSettingsFootnote')}</Card.Description>
        </Card.Body>
      </Card>

      <View style={{ gap: 10 }}>
        <Button variant="primary" onPress={onAllow} isDisabled={isSubmitting}>
          {isSubmitting ? t('auth.locationRequesting') : t('auth.locationAllow')}
        </Button>
        <Button variant="outline" onPress={onNotNow} isDisabled={isSubmitting}>
          {t('auth.locationNotNow')}
        </Button>
      </View>

      {errorMessage ? (
        <Alert status="danger">
          <Alert.Content>
            <Alert.Description accessibilityLiveRegion="polite">{errorMessage}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
    </AuthScreenShell>
  );
}
