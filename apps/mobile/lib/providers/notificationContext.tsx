import { createContext, ReactNode, useContext } from 'react';

export type NotificationContextValue = {
  expoPushToken: string | null;
  registerForPushNotifications: () => Promise<boolean>;
  unregisterPushToken: () => Promise<void>;
  updateNotificationSettings: (settings: Record<string, boolean>) => Promise<void>;
  notificationSettings: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
};

export const NOTIFICATION_CONTEXT_DEFAULT: NotificationContextValue = {
  expoPushToken: null,
  registerForPushNotifications: async () => false,
  unregisterPushToken: async () => {},
  updateNotificationSettings: async () => {},
  notificationSettings: {
    reviews: true,
    favorites: true,
    photoRequests: true,
    statusUpdates: true,
  },
  isLoading: false,
  error: null,
};

export const NotificationContext = createContext<NotificationContextValue>(
  NOTIFICATION_CONTEXT_DEFAULT
);

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationFallbackProvider({ children }: { children: ReactNode }) {
  return (
    <NotificationContext.Provider value={NOTIFICATION_CONTEXT_DEFAULT}>
      {children}
    </NotificationContext.Provider>
  );
}
