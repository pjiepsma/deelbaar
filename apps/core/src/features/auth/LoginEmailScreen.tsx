import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Button, Card, FieldError, Input, Label, TextField } from 'heroui-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { loginWithEmail } from '../../lib/api/auth/authClient';
import { getAuthOnboardingComplete } from '../../lib/auth/authOnboarding.storage';
import { authConfig } from '../../config/auth.config';
import { dismissAuthFlow } from './auth.navigation';
import type { AuthStackParamList } from './auth.types';
import { isEmailValid, isPasswordValid, normalizeEmail, normalizeError } from './auth.validation';
import { AuthScreenShell } from './AuthScreenShell';

type Props = NativeStackScreenProps<AuthStackParamList, 'LoginEmail'>;

export function LoginEmailScreen({ navigation, route }: Props) {
  const { applyAuthResponse, pendingNotificationsAfterLogin } = useAuth();
  const [email, setEmail] = useState(route.params?.initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasLockedEmail = Boolean(route.params?.initialEmail);

  const hasEmailError = useMemo(() => email.length > 0 && !isEmailValid(email), [email]);
  const hasPasswordError = useMemo(() => password.length > 0 && !isPasswordValid(password), [password]);
  const isSubmitDisabled = isSubmitting || !isEmailValid(email) || !isPasswordValid(password);

  const onSubmit = async (): Promise<void> => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const response = await loginWithEmail({ email: normalizeEmail(email), password });
      await applyAuthResponse(response);
      if (pendingNotificationsAfterLogin) {
        navigation.navigate('SignUpNotifications', { source: 'postLogin' });
        return;
      }
      const onboardingDone = await getAuthOnboardingComplete();
      if (!onboardingDone) {
        navigation.navigate('SignUpNotifications', { source: 'postLogin' });
        return;
      }
      dismissAuthFlow(navigation);
    } catch (error) {
      setErrorMessage(normalizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell title="Log in with email" description="Use your account password to continue.">
      {hasLockedEmail ? (
        <Card>
          <Card.Body style={{ gap: 6 }}>
            <Card.Description>Logging in as</Card.Description>
            <Card.Title>{email}</Card.Title>
          </Card.Body>
          <Card.Footer>
            <Button variant="outline" onPress={() => navigation.replace('AuthStart')} isDisabled={isSubmitting}>
              Use a different email
            </Button>
          </Card.Footer>
        </Card>
      ) : (
        <TextField isInvalid={hasEmailError}>
          <Label>Email</Label>
          <Input
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          {hasEmailError ? <FieldError>Enter a valid email address.</FieldError> : null}
        </TextField>
      )}

      <TextField isInvalid={hasPasswordError}>
        <Label>Password</Label>
        <Input
          placeholder={`At least ${authConfig.minPasswordLength} characters`}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {hasPasswordError ? <FieldError>Password must be at least {authConfig.minPasswordLength} characters.</FieldError> : null}
      </TextField>

      <View style={{ gap: 10 }}>
        <Button variant="primary" onPress={onSubmit} isDisabled={isSubmitDisabled}>
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </Button>
        <Button
          variant="secondary"
          onPress={() => navigation.navigate('ForgotPassword', { initialEmail: normalizeEmail(email) })}
          isDisabled={isSubmitting || !isEmailValid(email)}
        >
          Forgot password?
        </Button>
        <Button variant="outline" onPress={() => navigation.navigate('ResetPassword')} isDisabled={isSubmitting}>
          I already have a reset token
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
