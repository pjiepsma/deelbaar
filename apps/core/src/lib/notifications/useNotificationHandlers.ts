import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { openNotificationActionUrl } from './openNotificationActionUrl';

export function useNotificationHandlers(): void {
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const actionUrl = response.notification.request.content.data?.actionUrl;
      if (typeof actionUrl === 'string') {
        openNotificationActionUrl(actionUrl);
      }
    });

    return () => {
      responseSubscription.remove();
    };
  }, []);
}
