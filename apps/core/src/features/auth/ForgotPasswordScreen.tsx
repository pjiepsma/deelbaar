import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Button, FieldError, Input, Label, TextField } from 'heroui-native';
import { useMemo, useState } from 'react';

import { useLocale } from '../../context/LocaleContext';
import { requestPasswordReset } from '../../lib/api/auth/authClient';
import { AuthScreenShell } from '../../components/shared';
import { authForgotPasswordSentHref, authReplace } from '../../navigation/authPaths';
import { firstRouteParam } from '../../navigation/routeParams';
import { isEmailValid, normalizeEmail, normalizeError } from './auth.validation';

export function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ initialEmail?: string | string[] }>();
  const { t } = useLocale();
  const [email, setEmail] = useState(firstRouteParam(params.initialEmail) ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasEmailError = useMemo(() => email.length > 0 && !isEmailValid(email), [email]);
  const isSubmitDisabled = isSubmitting || !isEmailValid(email);

  const onSubmit = async (): Promise<void> => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const normalizedEmail = normalizeEmail(email);
      await requestPasswordReset({ email: normalizedEmail });
      authReplace(authForgotPasswordSentHref(normalizedEmail));
    } catch (error) {
      setErrorMessage(normalizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      title={t('auth.forgotPasswordTitle')}
      description={t('auth.forgotPasswordDescription')}
      onBack={() => router.back()}
      backAccessibilityLabel={t('listing.back')}
    >
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

      <Button variant="primary" onPress={onSubmit} isDisabled={isSubmitDisabled}>
        {isSubmitting ? t('auth.sendingEmail') : t('auth.sendResetEmail')}
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
