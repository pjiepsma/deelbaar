import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Button, FieldError, Input, Label, TextField } from 'heroui-native';
import { useMemo, useState } from 'react';

import { resetPassword } from '../../lib/api/auth/authClient';
import { useAuth } from '../../context/AuthContext';
import { authConfig } from '../../config/auth.config';
import { dismissAuthFlow } from './auth.navigation';
import type { AuthStackParamList } from './auth.types';
import { isPasswordValid, normalizeError } from './auth.validation';
import { AuthScreenShell } from './AuthScreenShell';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation }: Props) {
  const { applyAuthResponse } = useAuth();
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
      dismissAuthFlow(navigation);
    } catch (error) {
      setErrorMessage(normalizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      title="Reset password"
      description="Paste the token from your reset email and choose a new password."
    >
      <TextField>
        <Label>Reset token</Label>
        <Input placeholder="Paste token from your email" value={token} onChangeText={setToken} />
      </TextField>

      <TextField isInvalid={hasPasswordError}>
        <Label>New password</Label>
        <Input
          placeholder={`At least ${authConfig.minPasswordLength} characters`}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {hasPasswordError ? <FieldError>Password must be at least {authConfig.minPasswordLength} characters.</FieldError> : null}
      </TextField>

      <TextField isInvalid={hasConfirmError}>
        <Label>Confirm password</Label>
        <Input placeholder="Repeat new password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
        {hasConfirmError ? <FieldError>Passwords do not match.</FieldError> : null}
      </TextField>

      <Button variant="primary" onPress={onSubmit} isDisabled={isSubmitDisabled}>
        {isSubmitting ? 'Resetting password...' : 'Reset password'}
      </Button>

      {errorMessage ? (
        <Alert status="danger">
          <Alert.Content>
            <Alert.Description accessibilityLiveRegion="polite">{errorMessage}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <Button variant="outline" onPress={() => navigation.navigate('ForgotPassword')} isDisabled={isSubmitting}>
        Request another reset email
      </Button>
    </AuthScreenShell>
  );
}
