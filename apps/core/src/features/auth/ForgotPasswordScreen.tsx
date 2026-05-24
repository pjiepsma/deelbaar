import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Button, FieldError, Input, Label, TextField } from 'heroui-native';
import { useMemo, useState } from 'react';

import { requestPasswordReset } from '../../lib/api/auth/authClient';
import { AuthScreenShell } from './AuthScreenShell';
import type { AuthStackParamList } from './auth.types';
import { isEmailValid, normalizeEmail, normalizeError } from './auth.validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState(route.params?.initialEmail ?? '');
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
      navigation.replace('ForgotPasswordEmailSent', { email: normalizedEmail });
    } catch (error) {
      setErrorMessage(normalizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      title="Forgot password"
      description="Enter your email and we will send a password reset link."
    >
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

      <Button variant="primary" onPress={onSubmit} isDisabled={isSubmitDisabled}>
        {isSubmitting ? 'Sending email...' : 'Send reset email'}
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
