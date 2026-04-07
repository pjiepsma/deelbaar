import { ComponentType, ReactNode, useEffect, useState } from 'react';

import { NotificationFallbackProvider } from './notificationContext';

export { useNotifications } from './notificationContext';

/**
 * Loads expo-notifications only after mount so route discovery does not crash when the dev client
 * is missing native modules (e.g. ExpoTopicSubscriptionModule). After a native rebuild, full push
 * support is available.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [Impl, setImpl] = useState<ComponentType<{ children: ReactNode }> | null>(null);

  useEffect(() => {
    import('./NotificationProviderImpl')
      .then((m) => setImpl(() => m.NotificationProviderImpl))
      .catch((err) => {
        console.warn(
          '[NotificationProvider] Native notifications unavailable; rebuild the dev client (pnpm prebuild && pnpm android).',
          err
        );
        setImpl(() => NotificationFallbackProvider);
      });
  }, []);

  const Comp = Impl ?? NotificationFallbackProvider;
  return <Comp>{children}</Comp>;
}
