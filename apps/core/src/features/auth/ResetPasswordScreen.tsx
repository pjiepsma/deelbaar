import { useRouter } from 'expo-router';
import { Alert, Button, FieldError, Input, Label, TextField } from 'heroui-native';
import { useMemo, useState } from 'react';

import { resetPassword } from '../../lib/api/auth/authClient';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { authConfig } from '../../config/auth.config';
import { AuthPath, authPush } from '../../navigation/authPaths';
import { dismissAuthFlow } from './auth.navigation';
import { isPasswordValid, normalizeError } from './auth.validation';
import { AuthScreenShell } from '../../components/shared';

export function ResetPasswordScreen() {
  const router = useRouter();
  const { applyAuthResponse } = useAuth();
  const { t } = useLocale();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasPasswordError = useMemo(() => password.length > 0 && !isPasswordValid(password), [password]);
  const hasConfirmError = useMemo(() => confirmPassword.length > 0 && confirmPassword !== password, [confirmPassword, password]);
  const isSubmitDisabled =
    isSubmitting || !token.trim() || !isPasswordValid(password) || confirmPassword !== password;

  const onSubmit = async (): Promise<void> => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const response = await resetPassword({ token: token.trim(), password });
      await applyAuthResponse(response);
      dismissAuthFlow();
    } catch (error) {
      setErrorMessage(normalizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      title={t('auth.resetPasswordTitle')}
      description={t('auth.resetPasswordDescription')}
      onBack={() => router.back()}
      backAccessibilityLabel={t('listing.back')}
    >
      <TextField>
        <Label>{t('auth.resetTokenLabel')}</Label>
        <Input placeholder={t('auth.resetTokenPlaceholder')} value={token} onChangeText={setToken} />
      </TextField>

      <TextField isInvalid={hasPasswordError}>
        <Label>{t('auth.newPasswordLabel')}</Label>
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

      <TextField isInvalid={hasConfirmError}>
        <Label>{t('auth.confirmPasswordLabel')}</Label>
        <Input
          placeholder={t('auth.repeatNewPasswordPlaceholder')}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        {hasConfirmError ? <FieldError>{t('auth.passwordMismatch')}</FieldError> : null}
      </TextField>

      <Button variant="primary" onPress={onSubmit} isDisabled={isSubmitDisabled}>
        {isSubmitting ? t('auth.resettingPassword') : t('auth.resetPassword')}
      </Button>

      {errorMessage ? (
        <Alert status="danger">
          <Alert.Content>
            <Alert.Description accessibilityLiveRegion="polite">{errorMessage}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <Button variant="outline" onPress={() => authPush(AuthPath.forgotPassword)} isDisabled={isSubmitting}>
        {t('auth.requestAnotherResetEmail')}
      </Button>
    </AuthScreenShell>
  );
}
