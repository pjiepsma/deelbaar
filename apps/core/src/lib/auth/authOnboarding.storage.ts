import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_ONBOARDING_COMPLETE_KEY = 'auth_onboarding_complete_v1';

export async function getAuthOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(AUTH_ONBOARDING_COMPLETE_KEY);
  return value === '1';
}

export async function setAuthOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(AUTH_ONBOARDING_COMPLETE_KEY, '1');
}
