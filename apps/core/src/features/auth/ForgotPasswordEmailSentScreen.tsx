import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card } from 'heroui-native';

import { useLocale } from '../../context/LocaleContext';
import { AuthScreenShell } from '../../components/shared';
import { AuthPath, authPush } from '../../navigation/authPaths';
import { firstRouteParam } from '../../navigation/routeParams';

export function ForgotPasswordEmailSentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = firstRouteParam(params.email);
  const { t } = useLocale();

  if (!email) {
    throw new Error('ForgotPasswordEmailSentScreen requires email route param');
  }

  return (
    <AuthScreenShell
      title={t('auth.checkYourEmailTitle')}
      description={t('auth.checkYourEmailDescription')}
      onBack={() => router.back()}
      backAccessibilityLabel={t('listing.back')}
    >
      <Card>
        <Card.Body>
          <Card.Description>{email}</Card.Description>
        </Card.Body>
      </Card>
      <Button variant="primary" onPress={() => authPush(AuthPath.loginEmail)}>
        {t('auth.backToLogin')}
      </Button>
      <Button variant="outline" onPress={() => authPush(AuthPath.resetPassword)}>
        {t('auth.haveResetToken')}
      </Button>
    </AuthScreenShell>
  );
}
