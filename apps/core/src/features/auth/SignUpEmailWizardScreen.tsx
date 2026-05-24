import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Button, Card, FieldError, Input, Label, TextField } from 'heroui-native';
import { Stepper } from 'heroui-native-pro';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { registerWithEmail } from '../../lib/api/auth/authClient';
import { useSignupCredentials } from '../../context/SignupCredentialsContext';
import { useAuth } from '../../context/AuthContext';
import { authConfig } from '../../config/auth.config';
import type { AuthStackParamList } from './auth.types';
import { isEmailValid, isPasswordValid, normalizeEmail, normalizeError } from './auth.validation';
import { AuthScreenShell } from './AuthScreenShell';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUpEmailWizard'>;

const SIGNUP_STEPS = [
  { title: 'Account', description: 'Credentials' },
  { title: 'Profile', description: 'Optional details' },
];

export function SignUpEmailWizardScreen({ navigation, route }: Props) {
  const { applyAuthResponse } = useAuth();
  const { setSignupCredentials } = useSignupCredentials();
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState(route.params?.initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasEmailError = useMemo(() => email.length > 0 && !isEmailValid(email), [email]);
  const hasPasswordError = useMemo(() => password.length > 0 && !isPasswordValid(password), [password]);
  const hasConfirmError = useMemo(() => confirmPassword.length > 0 && confirmPassword !== password, [confirmPassword, password]);

  const hasInitialEmail = Boolean(route.params?.initialEmail);
  const canContinueCredentialsStep =
    (hasInitialEmail || isEmailValid(email)) && isPasswordValid(password) && confirmPassword === password;
  const isFinalStep = currentStep === SIGNUP_STEPS.length - 1;

  const onContinue = async (): Promise<void> => {
    setErrorMessage(null);
    if (!isFinalStep) {
      if (!canContinueCredentialsStep) {
        setErrorMessage('Enter a valid email and matching password fields.');
        return;
      }
      setCurrentStep(1);
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await registerWithEmail({
        email: normalizeEmail(email),
        password,
        name: name.trim() || undefined,
        surname: surname.trim() || undefined,
      });
      if (response.token && response.user) {
        await applyAuthResponse(response);
        navigation.navigate('WelcomeSignedUp');
        return;
      }
      const normalizedEmail = normalizeEmail(email);
      setSignupCredentials({ email: normalizedEmail, password });
      navigation.navigate('VerifyEmail', { email: normalizedEmail });
    } catch (error) {
      setErrorMessage(normalizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell title="Create account" description="Complete the short setup journey to register.">
      <Card>
        <Card.Body style={{ gap: 8 }}>
          <Stepper
            orientation="horizontal"
            currentStep={currentStep}
            onStepChange={(step) => setCurrentStep(Math.min(step, currentStep))}
          >
            {SIGNUP_STEPS.map((step) => (
              <Stepper.Step key={step.title}>
                <Stepper.Rail />
                <Stepper.Content>
                  <Stepper.Title>{step.title}</Stepper.Title>
                  <Stepper.Description>{step.description}</Stepper.Description>
                </Stepper.Content>
              </Stepper.Step>
            ))}
          </Stepper>
        </Card.Body>
      </Card>

      {currentStep === 0 ? (
        <>
          {hasInitialEmail ? (
            <Card>
              <Card.Body style={{ gap: 6 }}>
                <Card.Description>Creating account for</Card.Description>
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

          <TextField isInvalid={hasConfirmError}>
            <Label>Confirm password</Label>
            <Input placeholder="Repeat password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
            {hasConfirmError ? <FieldError>Passwords do not match.</FieldError> : null}
          </TextField>
        </>
      ) : (
        <>
          <TextField>
            <Label>First name (optional)</Label>
            <Input placeholder="First name" value={name} onChangeText={setName} />
          </TextField>
          <TextField>
            <Label>Surname (optional)</Label>
            <Input placeholder="Surname" value={surname} onChangeText={setSurname} />
          </TextField>
        </>
      )}

      {errorMessage ? (
        <Alert status="danger">
          <Alert.Content>
            <Alert.Description accessibilityLiveRegion="polite">{errorMessage}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          variant="outline"
          onPress={() => {
            if (currentStep === 0) {
              navigation.goBack();
              return;
            }
            setCurrentStep((step) => Math.max(step - 1, 0));
          }}
          isDisabled={isSubmitting}
        >
          Back
        </Button>
        <Button variant="primary" onPress={onContinue} isDisabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : isFinalStep ? 'Create account' : 'Continue'}
        </Button>
      </View>
    </AuthScreenShell>
  );
}
