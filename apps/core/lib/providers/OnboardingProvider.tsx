import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { useAuth } from './AuthProvider';

export type OnboardingStep =
  | 'welcome'
  | 'explore'
  | 'filter'
  | 'contribute'
  | 'account'
  | 'complete';

export interface OnboardingState {
  hasCompletedOnboarding: boolean;
  currentStep: OnboardingStep | null;
  skipped: boolean;
}

const ONBOARDING_STORAGE_KEY = 'deelbaar_onboarding_state';

const initialState: OnboardingState = {
  hasCompletedOnboarding: false,
  currentStep: null,
  skipped: false,
};

export const OnboardingContext = createContext<{
  state: OnboardingState;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  nextStep: () => void;
  goToStep: (step: OnboardingStep) => void;
  shouldShowOnboarding: boolean;
  isLoaded: boolean;
}>({
  state: initialState,
  startOnboarding: () => {},
  completeOnboarding: () => {},
  skipOnboarding: () => {},
  nextStep: () => {},
  goToStep: () => {},
  shouldShowOnboarding: false,
  isLoaded: false,
});

export function useOnboarding() {
  return useContext(OnboardingContext);
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadOnboardingState();
  }, []);

  // Start onboarding when user logs in and hasn't completed onboarding yet
  useEffect(() => {
    if (isLoaded && user && !state.hasCompletedOnboarding && !state.skipped) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isLoaded, user, state.hasCompletedOnboarding, state.skipped]);

  const loadOnboardingState = async () => {
    try {
      const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored);
        setState(parsedState);
      }
    } catch (error) {
      console.warn('[OnboardingProvider] Failed to load onboarding state:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveOnboardingState = async (newState: OnboardingState) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(newState));
      setState(newState);
    } catch (error) {
      console.warn('[OnboardingProvider] Failed to save onboarding state:', error);
    }
  };

  const startOnboarding = () => {
    const newState: OnboardingState = {
      hasCompletedOnboarding: false,
      currentStep: 'welcome',
      skipped: false,
    };
    saveOnboardingState(newState);
  };

  // Make startOnboarding available to other components (for manual triggering)
  const publicStartOnboarding = () => {
    startOnboarding();
  };

  const completeOnboarding = () => {
    const newState: OnboardingState = {
      hasCompletedOnboarding: true,
      currentStep: null,
      skipped: false,
    };
    saveOnboardingState(newState);
  };

  const skipOnboarding = () => {
    const newState: OnboardingState = {
      hasCompletedOnboarding: true,
      currentStep: null,
      skipped: true,
    };
    saveOnboardingState(newState);
  };

  const nextStep = () => {
    const steps: OnboardingStep[] = [
      'welcome',
      'explore',
      'filter',
      'contribute',
      'account',
      'complete',
    ];
    const currentIndex = state.currentStep ? steps.indexOf(state.currentStep) : -1;
    const nextIndex = currentIndex + 1;

    if (nextIndex >= steps.length) {
      completeOnboarding();
      return;
    }

    const nextStep = steps[nextIndex];
    const newState: OnboardingState = {
      ...state,
      currentStep: nextStep,
    };
    saveOnboardingState(newState);
  };

  const goToStep = (step: OnboardingStep) => {
    const newState: OnboardingState = {
      ...state,
      currentStep: step,
    };
    saveOnboardingState(newState);
  };

  // Show onboarding if user hasn't completed it and hasn't skipped it
  const shouldShowOnboarding = isLoaded && !state.hasCompletedOnboarding && !state.skipped;

  return (
    <OnboardingContext.Provider
      value={{
        state,
        startOnboarding: publicStartOnboarding,
        completeOnboarding,
        skipOnboarding,
        nextStep,
        goToStep,
        shouldShowOnboarding,
        isLoaded,
      }}>
      {children}
    </OnboardingContext.Provider>
  );
}
