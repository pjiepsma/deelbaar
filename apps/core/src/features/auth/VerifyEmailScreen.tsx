import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Button, FieldError, Input, Label, TextField } from 'heroui-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { useSignupCredentials, useClearSignupCredentials } from '../../context/SignupCredentialsContext';
import { useLocale } from '../../context/LocaleContext';
import { resendVerificationCode, verifyEmailWithCode } from '../../lib/api/auth/authClient';
import { useAuth } from '../../context/AuthContext';
import { authConfig } from '../../config/auth.config';
import type { AuthStackParamList } from './auth.types';
import { isEmailValid, isPasswordValid, normalizeEmail, normalizeError } from './auth.validation';
import { AuthScreenShell } from './AuthScreenShell';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

const normalizeCode = (raw: string): string => raw.replace(/\D/g, '').slice(0, 6);

export function VerifyEmailScreen({ navigation, route }: Props) {
  const { t } = useLocale();
  const { applyAuthResponse } = useAuth();
  const { credentials } = useSignupCredentials();
  const clearSignupCredentials = useClearSignupCredentials();

  const routeEmail = route.params?.email;
  const routeCode = route.params?.code;

  const [email, setEmail] = useState(routeEmail ?? credentials?.email ?? '');
  const [password, setPassword] = useState(credentials?.password ?? '');
  const [code, setCode] = useState(routeCode ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (routeEmail) {
      setEmail(routeEmail);
    }
  }, [routeEmail]);

  useEffect(() => {
    if (routeCode) {
      setCode(normalizeCode(routeCode));
    }
  }, [routeCode]);

  useEffect(() => {
    if (credentials?.password) {
      setPassword(credentials.password);
    }
  }, [credentials?.password]);

  const passwordRequired = !credentials?.password;
  const hasEmailError = useMemo(() => email.length > 0 && !isEmailValid(email), [email]);
  const hasPasswordError = useMemo(() => passwordRequired && password.length > 0 && !isPasswordValid(password), [password, passwordRequired]);
  const hasCodeError = useMemo(() => code.length > 0 && normalizeCode(code).length !== 6, [code]);

  const canSubmit =
    isEmailValid(normalizeEmail(email)) &&
    normalizeCode(code).length === 6 &&
    (!passwordRequired || isPasswordValid(password));

  const onVerify = async (): Promise<void> => {
    const normalizedEmail = normalizeEmail(email);
    if (!isEmailValid(normalizedEmail)) {
      setErrorMessage(t('auth.validEmailAlert'));
      return;
    }
    const normalizedCode = normalizeCode(code);
    if (normalizedCode.length !== 6) {
      setErrorMessage(t('auth.verifyCodeInvalid'));
      return;
    }
    const resolvedPassword = credentials?.password ?? password;
    if (!isPasswordValid(resolvedPassword)) {
      setErrorMessage(t('auth.verifyPasswordRequired'));
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const response = await verifyEmailWithCode({
        email: normalizedEmail,
        password: resolvedPassword,
        code: normalizedCode,
      });
      await applyAuthResponse(response);
      clearSignupCredentials();
      navigation.navigate('WelcomeSignedUp');
    } catch (error) {
      setErrorMessage(normalizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResend = async (): Promise<void> => {
    const normalizedEmail = normalizeEmail(email);
    if (!isEmailValid(normalizedEmail)) {
      setErrorMessage(t('auth.validEmailAlert'));
      return;
    }
    setErrorMessage(null);
    setIsResending(true);
    try {
      await resendVerificationCode({ email: normalizedEmail });
    } catch (error) {
      setErrorMessage(normalizeError(error));
    } finally {
      setIsResending(false);
    }
  };

  const onOpenLogin = useCallback((): void => {
    navigation.navigate('LoginEmail', { initialEmail: normalizeEmail(email) });
  }, [email, navigation]);

  return (
    <AuthScreenShell title={t('auth.verifyTitle')} description={t('auth.verifyDescription')}>
      <TextField isInvalid={hasEmailError}>
        <Label>{t('auth.emailLabel')}</Label>
        <Input
          placeholder={t('auth.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!credentials?.email}
        />
        {hasEmailError ? <FieldError>{t('auth.validEmailFieldError')}</FieldError> : null}
      </TextField>

      {passwordRequired ? (
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
      ) : null}

      <TextField isInvalid={hasCodeError}>
        <Label>{t('auth.verifyCodeLabel')}</Label>
        <Input
          placeholder={t('auth.verifyCodePlaceholder')}
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={(next) => setCode(normalizeCode(next))}
          accessibilityLabel={t('auth.verifyCodeAccessibility')}
        />
        {hasCodeError ? <FieldError>{t('auth.verifyCodeFieldError')}</FieldError> : null}
      </TextField>

      <View style={{ gap: 10 }}>
        <Button variant="primary" onPress={onVerify} isDisabled={isSubmitting || !canSubmit}>
          {isSubmitting ? t('auth.verifySubmitting') : t('auth.verifyCta')}
        </Button>
        <Button variant="outline" onPress={onResend} isDisabled={isResending || isSubmitting}>
          {isResending ? t('auth.verifyResending') : t('auth.verifyResend')}
        </Button>
        <Button variant="secondary" onPress={onOpenLogin} isDisabled={isSubmitting}>
          {t('auth.verifyBackToLogin')}
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
