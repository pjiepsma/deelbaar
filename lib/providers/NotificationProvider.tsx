import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { useAuth } from './AuthProvider';
import { payloadClient } from '../api/PayloadClient';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationContext = createContext<{
  expoPushToken: string | null;
  registerForPushNotifications: () => Promise<boolean>;
  unregisterPushToken: () => Promise<void>;
  updateNotificationSettings: (settings: Record<string, boolean>) => Promise<void>;
  notificationSettings: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
}>({
  expoPushToken: null,
  registerForPushNotifications: async () => false,
  unregisterPushToken: async () => {},
  updateNotificationSettings: async () => {},
  notificationSettings: {},
  isLoading: false,
  error: null,
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<Record<string, boolean>>({
    reviews: true,
    favorites: true,
    photoRequests: true,
    statusUpdates: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load stored notification settings
    loadNotificationSettingsFromStorage();

    // Set up notification response handler
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response received:', response);
        // Handle notification tap here
      }
    );

    // Set up notification received handler
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (user) {
      // Load user's notification settings from backend
      loadNotificationSettingsFromBackend();

      if (expoPushToken) {
        // Update user's push token in backend
        updatePushToken();
      }
    }
  }, [user, expoPushToken]);

  const loadNotificationSettingsFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem('notification_settings');
      if (stored) {
        setNotificationSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load notification settings from storage:', error);
    }
  };

  const loadNotificationSettingsFromBackend = async () => {
    if (!user || !token) return;

    try {
      console.log('[NotificationProvider] Loading notification settings from backend...');
      // The user object should already contain notificationSettings from the login response
      if (user.notificationSettings) {
        setNotificationSettings(user.notificationSettings);
        // Also save to local storage
        await AsyncStorage.setItem(
          'notification_settings',
          JSON.stringify(user.notificationSettings)
        );
        console.log(
          '[NotificationProvider] Loaded settings from backend:',
          user.notificationSettings
        );
      } else {
        console.log(
          '[NotificationProvider] No notification settings in user object, using defaults'
        );
      }
    } catch (error) {
      console.error('[NotificationProvider] Failed to load settings from backend:', error);
    }
  };

  const registerForPushNotifications = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[NotificationProvider] Starting push notification registration...');

      // Check current permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('[NotificationProvider] Current permission status:', existingStatus);

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('[NotificationProvider] Requesting permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('[NotificationProvider] Permission request result:', status);
      }

      if (finalStatus !== 'granted') {
        const errorMsg = 'Push notification permission denied by user';
        console.log('[NotificationProvider]', errorMsg);
        setError(errorMsg);
        return false;
      }

      console.log('[NotificationProvider] Getting Expo push token...');
      // Get the token that uniquely identifies this device
      const tokenResult = await Notifications.getExpoPushTokenAsync();
      console.log('[NotificationProvider] Expo push token received:', tokenResult.data);

      if (!tokenResult.data) {
        const errorMsg = 'Failed to get push token from Expo';
        console.log('[NotificationProvider]', errorMsg);
        setError(errorMsg);
        return false;
      }

      setExpoPushToken(tokenResult.data);
      console.log('[NotificationProvider] Push token registration successful');
      return true;
    } catch (error: any) {
      const errorMsg = `Kon geen push token ophalen. Probeer het later opnieuw. (${error.message})`;
      console.error('[NotificationProvider] Registration error:', error);
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unregisterPushToken = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setExpoPushToken(null);
      // Update backend to remove push token
      await updatePushToken();
      console.log('[NotificationProvider] Push token unregistered');
    } catch (error: any) {
      console.error('[NotificationProvider] Unregister error:', error);
      setError(`Fout bij uitschrijven: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePushToken = async () => {
    if (!user || !token) {
      console.log('[NotificationProvider] No user/token, skipping push token update');
      return;
    }

    try {
      console.log('[NotificationProvider] Updating push token in backend...');
      await payloadClient.update('users', user.id, {
        pushToken: expoPushToken,
      });
      console.log('[NotificationProvider] Push token updated in backend');
    } catch (error: any) {
      console.error('[NotificationProvider] Failed to update push token:', error);
      setError(`Fout bij updaten push token: ${error.message}`);
    }
  };

  const updateNotificationSettings = async (settings: Record<string, boolean>) => {
    try {
      setIsLoading(true);
      setError(null);

      setNotificationSettings(settings);
      await AsyncStorage.setItem('notification_settings', JSON.stringify(settings));

      // Update backend with notification preferences
      if (user && token) {
        await payloadClient.update('users', user.id, {
          notificationSettings: settings,
        });
      }

      console.log('[NotificationProvider] Notification settings updated');
    } catch (error: any) {
      console.error('[NotificationProvider] Failed to update notification settings:', error);
      setError(`Fout bij updaten instellingen: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        registerForPushNotifications,
        unregisterPushToken,
        updateNotificationSettings,
        notificationSettings,
        isLoading,
        error,
      }}>
      {children}
    </NotificationContext.Provider>
  );
}
