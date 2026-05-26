import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Button, Card, FieldError, Input, Label, TextField } from 'heroui-native';
import { Stepper } from 'heroui-native-pro/stepper';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { registerWithEmail } from '../../lib/api/auth/authClient';
import { useSignupCredentials } from '../../context/SignupCredentialsContext';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { authConfig } from '../../config/auth.config';
import type { AuthStackParamList } from './auth.types';
import { isEmailValid, isPasswordValid, normalizeEmail, normalizeError } from './auth.validation';
import { AuthScreenShell } from '../../components/shared';
import { fireHaptic } from '../../lib/utils/fire-haptic';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUpEmailWizard'>;

export function SignUpEmailWizardScreen({ navigation, route }: Props) {
  const { applyAuthResponse } = useAuth();
  const { t } = useLocale();
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
  const signUpSteps = useMemo(
    () => [
      { title: t('auth.signUpStepAccountTitle'), description: t('auth.signUpStepAccountDescription') },
      { title: t('auth.signUpStepProfileTitle'), description: t('auth.signUpStepProfileDescription') },
    ],
    [t],
  );
  const isFinalStep = currentStep === signUpSteps.length - 1;

  const onContinue = async (): Promise<void> => {
    setErrorMessage(null);
    if (!isFinalStep) {
      if (!canContinueCredentialsStep) {
        setErrorMessage(t('auth.signUpCredentialsInvalid'));
        return;
      }
      fireHaptic();
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
    <AuthScreenShell title={t('auth.createAccountTitle')} description={t('auth.createAccountDescription')}>
      <Card>
        <Card.Body style={{ gap: 8 }}>
          <Stepper
            orientation="horizontal"
            currentStep={currentStep}
            onStepChange={(step: number) => setCurrentStep(Math.min(step, currentStep))}
          >
            {signUpSteps.map((step) => (
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
                <Card.Description>{t('auth.creatingAccountFor')}</Card.Description>
                <Card.Title>{email}</Card.Title>
              </Card.Body>
              <Card.Footer>
                <Button variant="outline" onPress={() => navigation.replace('AuthStart')} isDisabled={isSubmitting}>
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

          <TextField isInvalid={hasConfirmError}>
            <Label>{t('auth.confirmPasswordLabel')}</Label>
            <Input
              placeholder={t('auth.repeatPasswordPlaceholder')}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            {hasConfirmError ? <FieldError>{t('auth.passwordMismatch')}</FieldError> : null}
          </TextField>
        </>
      ) : (
        <>
          <TextField>
            <Label>{t('auth.firstNameOptionalLabel')}</Label>
            <Input placeholder={t('auth.firstNamePlaceholder')} value={name} onChangeText={setName} />
          </TextField>
          <TextField>
            <Label>{t('auth.surnameOptionalLabel')}</Label>
            <Input placeholder={t('auth.surnamePlaceholder')} value={surname} onChangeText={setSurname} />
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
          {t('auth.back')}
        </Button>
        <Button variant="primary" onPress={onContinue} isDisabled={isSubmitting}>
          {isSubmitting ? t('auth.creatingAccount') : isFinalStep ? t('auth.createAccount') : t('auth.continue')}
        </Button>
      </View>
    </AuthScreenShell>
  );
}
