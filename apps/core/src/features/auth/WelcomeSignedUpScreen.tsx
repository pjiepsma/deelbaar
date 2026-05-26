import { useRouter } from 'expo-router';
import { Button, Card } from 'heroui-native';
import { View } from 'react-native';

import { useLocale } from '../../context/LocaleContext';
import { authNotificationsHref, authPush } from '../../navigation/authPaths';
import { AuthScreenShell } from '../../components/shared';

export function WelcomeSignedUpScreen() {
  const router = useRouter();
  const { t } = useLocale();

  const goNext = (): void => {
    authPush(authNotificationsHref('signup'));
  };

  return (
    <AuthScreenShell
      title={t('auth.welcomeTitle')}
      description={t('auth.welcomeDescription')}
      onBack={() => router.back()}
      backAccessibilityLabel={t('listing.back')}
    >
      <Card>
        <Card.Body>
          <Card.Description>{t('auth.deviceSettingsFootnote')}</Card.Description>
        </Card.Body>
      </Card>

      <View style={{ gap: 10 }}>
        <Button variant="primary" onPress={goNext}>
          {t('auth.welcomeContinue')}
        </Button>
        <Button variant="outline" onPress={goNext}>
          {t('auth.welcomeSkip')}
        </Button>
      </View>
    </AuthScreenShell>
  );
}
