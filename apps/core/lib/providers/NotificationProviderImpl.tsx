import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { ReactNode, useEffect, useState } from 'react';

import { useAuth } from './AuthProvider';
import { NotificationContext } from './notificationContext';
import { getPayloadSdk } from '../api/payloadSdk';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function NotificationProviderImpl({ children }: { children: ReactNode }) {
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
    loadNotificationSettingsFromStorage();

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response received:', response);
      }
    );

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
      loadNotificationSettingsFromBackend();

      if (expoPushToken) {
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
    } catch (err) {
      console.error('Failed to load notification settings from storage:', err);
    }
  };

  const loadNotificationSettingsFromBackend = async () => {
    if (!user || !token) return;

    try {
      console.log('[NotificationProvider] Loading notification settings from backend...');
      if (user.notificationSettings) {
        setNotificationSettings(user.notificationSettings);
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
    } catch (err) {
      console.error('[NotificationProvider] Failed to load settings from backend:', err);
    }
  };

  const registerForPushNotifications = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[NotificationProvider] Starting push notification registration...');

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const errorMsg = `Kon geen push token ophalen. Probeer het later opnieuw. (${message})`;
      console.error('[NotificationProvider] Registration error:', err);
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
      await updatePushToken();
      console.log('[NotificationProvider] Push token unregistered');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[NotificationProvider] Unregister error:', err);
      setError(`Fout bij uitschrijven: ${message}`);
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
      await getPayloadSdk().update({
        collection: 'users',
        id: user.id,
        data: { pushToken: expoPushToken },
      });
      console.log('[NotificationProvider] Push token updated in backend');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[NotificationProvider] Failed to update push token:', err);
      setError(`Fout bij updaten push token: ${message}`);
    }
  };

  const updateNotificationSettings = async (settings: Record<string, boolean>) => {
    try {
      setIsLoading(true);
      setError(null);

      setNotificationSettings(settings);
      await AsyncStorage.setItem('notification_settings', JSON.stringify(settings));

      if (user && token) {
        await getPayloadSdk().update({
          collection: 'users',
          id: user.id,
          data: { notificationSettings: settings },
        });
      }

      console.log('[NotificationProvider] Notification settings updated');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[NotificationProvider] Failed to update notification settings:', err);
      setError(`Fout bij updaten instellingen: ${message}`);
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
