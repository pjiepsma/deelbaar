import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Button, FieldError, Input, TextField, useThemeColor } from 'heroui-native';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { loginWithGoogleIdToken, lookupEmailRegistered } from '../../lib/api/auth/authClient';
import { getAuthOnboardingComplete } from '../../lib/auth/authOnboarding.storage';
import { requestGoogleIdToken } from '../../lib/auth/googleSignIn';
import { dismissAuthFlow } from './auth.navigation';
import type { AuthStackParamList } from './auth.types';
import { AuthScreenShell } from '../../components/shared';
import { isEmailValid, normalizeEmail, normalizeError } from './auth.validation';
import { DeelbaarLogo } from './DeelbaarLogo';

type Props = NativeStackScreenProps<AuthStackParamList, 'AuthStart'>;

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

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

export function AuthStartScreen({ navigation }: Props) {
  const { applyAuthResponse, pendingNotificationsAfterLogin } = useAuth();
  const { t } = useLocale();
  const logoColor = useThemeColor('foreground');
  const mutedColor = useThemeColor('muted');
  const googleChromeColor = useThemeColor('foreground');
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
        navigation.navigate('LoginEmail', { initialEmail: normalizedEmail });
        return;
      }
      navigation.navigate('SignUpEmailWizard', { initialEmail: normalizedEmail });
    } catch (error) {
      setErrorMessage(normalizeError(error));
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const onContinueWithGoogle = async (): Promise<void> => {
    setErrorMessage(null);
    if (!GOOGLE_CLIENT_ID) {
      setErrorMessage(t('auth.missingGoogleClient'));
      return;
    }

    setIsGoogleSubmitting(true);
    try {
      const idToken = await requestGoogleIdToken(GOOGLE_CLIENT_ID);
      const response = await loginWithGoogleIdToken({ idToken });
      await applyAuthResponse(response);
      if (pendingNotificationsAfterLogin) {
        navigation.navigate('SignUpNotifications', { source: 'postLogin' });
        return;
      }
      const onboardingDone = await getAuthOnboardingComplete();
      if (!onboardingDone) {
        navigation.navigate('SignUpNotifications', { source: 'signup' });
        return;
      }
      dismissAuthFlow(navigation);
    } catch (error) {
      setErrorMessage(normalizeError(error));
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      layout="centered"
      title={t('auth.loginOrSignUp')}
      titlePresentation="plain"
      titleAlign="center"
      leading={
        <View className="items-center pb-5">
          <DeelbaarLogo color={logoColor} />
          <Text style={{ marginTop: 14, color: mutedColor, fontSize: 14, textAlign: 'center', paddingHorizontal: 8 }}>
            {t('auth.valueProp')}
          </Text>
        </View>
      }
    >
      <View className="gap-4">
        <View className="gap-3">
          <TextField isInvalid={hasEmailError}>
            <Input
              placeholder={t('auth.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
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
            variant="primary"
            onPress={onContinue}
            isDisabled={isContinueDisabled}
            accessibilityLabel={t('auth.continue')}
          >
            {isCheckingEmail ? t('auth.checkingEmail') : t('auth.continue')}
          </Button>
        </View>

        <View className="gap-3 pt-4">
          <AuthStartDivider label={t('auth.orDivider')} />
          <Button
            variant="outline"
            onPress={onContinueWithGoogle}
            isDisabled={isCheckingEmail || isGoogleSubmitting}
            accessibilityLabel={t('auth.continueWithGoogle')}
          >
            <Button.Label>
              <View className="flex-row items-center gap-3">
                <MaterialCommunityIcons name="google" size={20} color={googleChromeColor} />
                <Text style={{ fontSize: 17, fontWeight: '500', color: googleChromeColor }}>
                  {isGoogleSubmitting ? t('auth.connectingGoogle') : t('auth.continueWithGoogle')}
                </Text>
              </View>
            </Button.Label>
          </Button>
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
