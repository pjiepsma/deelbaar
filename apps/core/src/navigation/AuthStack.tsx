import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';

import { SignupCredentialsProvider } from '../context/SignupCredentialsContext';
import { AllowLocationScreen } from '../features/auth/AllowLocationScreen';
import { AuthStartScreen } from '../features/auth/AuthStartScreen';
import { ForgotPasswordEmailSentScreen } from '../features/auth/ForgotPasswordEmailSentScreen';
import { ForgotPasswordScreen } from '../features/auth/ForgotPasswordScreen';
import { LoginEmailScreen } from '../features/auth/LoginEmailScreen';
import { ResetPasswordScreen } from '../features/auth/ResetPasswordScreen';
import { SignUpEmailWizardScreen } from '../features/auth/SignUpEmailWizardScreen';
import { SignUpNotificationsScreen } from '../features/auth/SignUpNotificationsScreen';
import { VerifyEmailScreen } from '../features/auth/VerifyEmailScreen';
import { WelcomeSignedUpScreen } from '../features/auth/WelcomeSignedUpScreen';
import type { AuthStackParamList } from '../features/auth/auth.types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigatorTree() {
  return (
    <Stack.Navigator initialRouteName="AuthStart" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="AuthStart" component={AuthStartScreen} />
      <Stack.Screen name="LoginEmail" component={LoginEmailScreen} />
      <Stack.Screen name="SignUpEmailWizard" component={SignUpEmailWizardScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ForgotPasswordEmailSent" component={ForgotPasswordEmailSentScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="WelcomeSignedUp" component={WelcomeSignedUpScreen} />
      <Stack.Screen name="SignUpNotifications" component={SignUpNotificationsScreen} />
      <Stack.Screen name="AllowLocation" component={AllowLocationScreen} />
    </Stack.Navigator>
  );
}

export function AuthModalStack() {
  return (
    <View style={{ flex: 1 }}>
      <SignupCredentialsProvider>
        <AuthNavigatorTree />
      </SignupCredentialsProvider>
    </View>
  );
}
