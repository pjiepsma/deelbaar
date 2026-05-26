import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Button, Card, FieldError, Input, Label, TextField } from 'heroui-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { loginWithEmail } from '../../lib/api/auth/authClient';
import { getAuthOnboardingComplete } from '../../lib/auth/authOnboarding.storage';
import { authConfig } from '../../config/auth.config';
import {
  AuthPath,
  authForgotPasswordHref,
  authNotificationsHref,
  authPush,
  authReplace,
} from '../../navigation/authPaths';
import { firstRouteParam } from '../../navigation/routeParams';
import { dismissAuthFlow } from './auth.navigation';
import { isEmailValid, isPasswordValid, normalizeEmail, normalizeError } from './auth.validation';
import { AuthScreenShell } from '../../components/shared';
import { fireHaptic } from '../../lib/utils/fire-haptic';

export function LoginEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ initialEmail?: string | string[] }>();
  const initialEmail = firstRouteParam(params.initialEmail);
  const { applyAuthResponse, pendingNotificationsAfterLogin } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = useState(initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasLockedEmail = Boolean(initialEmail);

  const hasEmailError = useMemo(() => email.length > 0 && !isEmailValid(email), [email]);
  const hasPasswordError = useMemo(() => password.length > 0 && !isPasswordValid(password), [password]);
  const isSubmitDisabled = isSubmitting || !isEmailValid(email) || !isPasswordValid(password);

  const onSubmit = async (): Promise<void> => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const response = await loginWithEmail({ email: normalizeEmail(email), password });
      await applyAuthResponse(response);
      fireHaptic();
      if (pendingNotificationsAfterLogin) {
        authPush(authNotificationsHref('postLogin'));
        return;
      }
      const onboardingDone = await getAuthOnboardingComplete();
      if (!onboardingDone) {
        authPush(authNotificationsHref('postLogin'));
        return;
      }
      dismissAuthFlow();
    } catch (error) {
      setErrorMessage(normalizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      title={t('auth.loginWithEmailTitle')}
      description={t('auth.loginWithEmailDescription')}
      onBack={() => router.back()}
      backAccessibilityLabel={t('listing.back')}
    >
      {hasLockedEmail ? (
        <Card>
          <Card.Body style={{ gap: 6 }}>
            <Card.Description>{t('auth.loggingInAs')}</Card.Description>
            <Card.Title>{email}</Card.Title>
          </Card.Body>
          <Card.Footer>
            <Button variant="outline" onPress={() => authReplace(AuthPath.start)} isDisabled={isSubmitting}>
              {t('auth.useDifferentEmail')}
            </Button>
          </Card.Footer>
        </Card>
      ) : (
        <TextField isInvalid={hasEmailError}>
          <Label>{t('auth.emailLabel')}</Label>
          <Input
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          {hasEmailError ? <FieldError>{t('auth.validEmailFieldError')}</FieldError> : null}
        </TextField>
      )}

      <TextField isInvalid={hasPasswordError}>
        <Label>{t('auth.passwordLabel')}</Label>
        <Input
          placeholder={t('auth.passwordPlaceholder', { min: String(authConfig.minPasswordLength) })}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {hasPasswordError ? (
          <FieldError>{t('auth.passwordMinError', { min: String(authConfig.minPasswordLength) })}</FieldError>
        ) : null}
      </TextField>

      <View style={{ gap: 10 }}>
        <Button variant="primary" onPress={onSubmit} isDisabled={isSubmitDisabled}>
          {isSubmitting ? t('auth.loggingIn') : t('auth.login')}
        </Button>
        <Button
          variant="secondary"
          onPress={() => authPush(authForgotPasswordHref(normalizeEmail(email)))}
          isDisabled={isSubmitting || !isEmailValid(email)}
        >
          {t('auth.forgotPassword')}
        </Button>
        <Button variant="outline" onPress={() => authPush(AuthPath.resetPassword)} isDisabled={isSubmitting}>
          {t('auth.haveResetToken')}
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
