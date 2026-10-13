import { useRouter } from 'expo-router';
import { Alert, Button, FieldError, Input, Label, TextField, useThemeColor } from 'heroui-native';
import { useMemo, useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { DoodleImage } from '../../branding/DoodleImage';
import { GoogleGlyph } from '../../branding/GoogleGlyph';
import { AUTH_START_DOODLE, AUTH_START_DOODLE_SIZE } from '../../branding/doodles';
import { AuthScreenShell, SoftCtaButton } from '../../components/shared';
import { TestId } from '../../testing/testIds';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { loginWithGoogleIdToken, lookupEmailRegistered } from '../../lib/api/auth/authClient';
import { getAuthOnboardingComplete } from '../../lib/auth/authOnboarding.storage';
import { requestGoogleIdToken } from '../../lib/auth/googleSignIn';
import {
  authLoginEmailHref,
  authNotificationsHref,
  authPush,
  authSignUpHref,
} from '../../navigation/authPaths';
import { dismissAuthFlow } from './auth.navigation';
import { isEmailValid, normalizeEmail, normalizeError } from './auth.validation';

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

function hasGoogleClientIdForPlatform(): boolean {
  if (Platform.OS === 'ios') {
    return Boolean(GOOGLE_IOS_CLIENT_ID);
  }
  if (Platform.OS === 'android') {
    return Boolean(GOOGLE_WEB_CLIENT_ID);
  }
  return false;
}

function AuthStartDivider({ label }: { label: string }) {
  const lineColor = useThemeColor('separator');
  const labelColor = useThemeColor('muted');

  return (
    <View className="flex-row items-center gap-2.5">
      <View style={{ flex: 1, height: 1, backgroundColor: lineColor }} />
      <Text style={{ color: labelColor, fontSize: 13, textTransform: 'lowercase' }}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: lineColor }} />
    </View>
  );
}

export function AuthStartScreen() {
  const router = useRouter();
  const { applyAuthResponse, pendingNotificationsAfterLogin } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasEmailError = useMemo(() => email.length > 0 && !isEmailValid(email), [email]);
  const isContinueDisabled = isCheckingEmail || isGoogleSubmitting || !isEmailValid(email);

  const onContinue = async (): Promise<void> => {
    const normalizedEmail = normalizeEmail(email);
    if (!isEmailValid(normalizedEmail)) {
      setErrorMessage(t('auth.validEmailAlert'));
      return;
    }

    setErrorMessage(null);
    setIsCheckingEmail(true);
    try {
      const { exists } = await lookupEmailRegistered({ email: normalizedEmail });
      if (exists) {
        authPush(authLoginEmailHref(normalizedEmail));
        return;
      }
      authPush(authSignUpHref(normalizedEmail));
    } catch (error) {
      setErrorMessage(normalizeError(error));
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const onContinueWithGoogle = async (): Promise<void> => {
    setErrorMessage(null);
    if (!hasGoogleClientIdForPlatform()) {
      setErrorMessage(t('auth.missingGoogleClient'));
      return;
    }

    setIsGoogleSubmitting(true);
    try {
      const idToken = await requestGoogleIdToken({
        iosClientId: GOOGLE_IOS_CLIENT_ID,
        androidClientId: GOOGLE_WEB_CLIENT_ID,
      });
      const response = await loginWithGoogleIdToken({ idToken });
      await applyAuthResponse(response);
      if (pendingNotificationsAfterLogin) {
        authPush(authNotificationsHref('postLogin'));
        return;
      }
      const onboardingDone = await getAuthOnboardingComplete();
      if (!onboardingDone) {
        authPush(authNotificationsHref('signup'));
        return;
      }
      dismissAuthFlow();
    } catch (error) {
      setErrorMessage(normalizeError(error));
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      testID={TestId.screenAuthStart}
      layout="default"
      title={t('auth.loginOrSignUp')}
      titlePresentation="plain"
      titleAlign="left"
      onBack={() => router.back()}
      backAccessibilityLabel={t('listing.back')}
      leading={
        <View className="items-center pb-4 pt-2">
          <DoodleImage
            id={AUTH_START_DOODLE}
            size={AUTH_START_DOODLE_SIZE}
            accessibilityLabel={t('auth.startArtA11y')}
          />
        </View>
      }
    >
      <Text className="text-muted mb-5 text-base">{t('auth.valueProp')}</Text>

      <View className="gap-4">
        <View className="gap-3">
          <TextField isInvalid={hasEmailError}>
            <Label>{t('auth.emailLabel')}</Label>
            <Input
              testID={TestId.fieldAuthEmail}
              placeholder={t('auth.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
              accessibilityLabel={t('auth.emailLabel')}
              onSubmitEditing={() => {
                if (!isContinueDisabled) {
                  void onContinue();
                }
              }}
            />
            {hasEmailError ? <FieldError>{t('auth.validEmailFieldError')}</FieldError> : null}
          </TextField>
          <Button
            testID={TestId.btnAuthContinue}
            variant="primary"
            onPress={onContinue}
            isDisabled={isContinueDisabled}
            accessibilityLabel={t('auth.continue')}
          >
            <Button.Label>
              {isCheckingEmail ? t('auth.checkingEmail') : t('auth.continue')}
            </Button.Label>
          </Button>
        </View>

        <View className="gap-3 pt-2">
          <AuthStartDivider label={t('auth.orDivider')} />
          <SoftCtaButton
            testID={TestId.btnAuthGoogle}
            onPress={onContinueWithGoogle}
            isDisabled={isCheckingEmail || isGoogleSubmitting}
            accessibilityLabel={t('auth.continueWithGoogle')}
            startIcon={<GoogleGlyph />}
            label={isGoogleSubmitting ? t('auth.connectingGoogle') : t('auth.continueWithGoogle')}
          />
        </View>
      </View>

      {errorMessage ? (
        <Alert status="danger" className="mt-3">
          <Alert.Content>
            <Alert.Description accessibilityLiveRegion="polite">{errorMessage}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
    </AuthScreenShell>
  );
}
