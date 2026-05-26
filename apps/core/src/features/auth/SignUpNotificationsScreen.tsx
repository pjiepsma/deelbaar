import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Button, Card } from 'heroui-native';
import { useMemo, useState } from 'react';

import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { updateUser } from '../../lib/api/auth/authClient';
import { authAllowLocationHref, authPush } from '../../navigation/authPaths';
import { firstRouteParam } from '../../navigation/routeParams';
import { normalizeError } from './auth.validation';
import { AuthScreenShell } from '../../components/shared';

function authOnboardingSource(value: string | undefined): 'signup' | 'postLogin' {
  if (value === 'signup' || value === 'postLogin') {
    return value;
  }
  throw new Error(`SignUpNotificationsScreen requires source param, got: ${value ?? 'undefined'}`);
}

function pushTokenToString(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object' && 'token' in value) {
    const token = (value as { token?: unknown }).token;
    if (typeof token === 'string') {
      return token;
    }
  }
  return null;
}

export function SignUpNotificationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string | string[] }>();
  const source = authOnboardingSource(firstRouteParam(params.source));
  const { t } = useLocale();
  const { user, clearPendingNotificationsAfterLogin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const screenDescription = useMemo(() => {
    if (source === 'postLogin') {
      return t('auth.notificationsDescriptionPostLogin');
    }
    return t('auth.notificationsDescriptionSignup');
  }, [source, t]);

  const proceedAfterNotifications = async (): Promise<void> => {
    await clearPendingNotificationsAfterLogin();
    authPush(authAllowLocationHref(source));
  };

  const onAllow = async (): Promise<void> => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const existing = await Notifications.getPermissionsAsync();
      const permission =
        existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
          ? existing
          : await Notifications.requestPermissionsAsync();

      if (!permission.granted) {
        await proceedAfterNotifications();
        return;
      }

      if (user) {
        const deviceToken = await Notifications.getDevicePushTokenAsync();
        const serializedToken = pushTokenToString(deviceToken.data);
        if (serializedToken) {
          await updateUser(user.id, { pushToken: serializedToken });
        }
      }
      await proceedAfterNotifications();
    } catch (error) {
      setErrorMessage(normalizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onNotNow = async (): Promise<void> => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await proceedAfterNotifications();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      title={t('auth.notificationsTitle')}
      description={screenDescription}
      onBack={() => router.back()}
      backAccessibilityLabel={t('listing.back')}
    >
      <Card>
        <Card.Body>
          <Card.Description>{t('auth.notificationsFootnote')}</Card.Description>
        </Card.Body>
      </Card>

      <Button variant="primary" onPress={onAllow} isDisabled={isSubmitting}>
        {isSubmitting ? t('auth.notificationsRequesting') : t('auth.notificationsAllow')}
      </Button>
      <Button variant="outline" onPress={onNotNow} isDisabled={isSubmitting}>
        {t('auth.notificationsNotNow')}
      </Button>

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
