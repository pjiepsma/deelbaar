import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Card, Skeleton, useThemeColor } from 'heroui-native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  EmptyList,
  GuestAuthCard,
  Screen,
  ScreenBackChrome,
  TAB_SCREEN_CONTENT_BOTTOM_PADDING,
  TAB_SCREEN_HORIZONTAL_PADDING,
  TabScreenHeader,
} from '../../components/shared';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { fetchNotifications, markNotificationRead } from '../../lib/api/notifications/notificationsClient';
import { openNotificationActionUrl } from '../../lib/notifications/openNotificationActionUrl';
import type { Notification } from '../../lib/types/payload-generated';
import { navigateToAuthStart } from '../../navigation/rootNavigation';

function formatTimestamp(iso: string | null | undefined, locale: string): string {
  if (!iso) {
    return '';
  }
  return new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function NotificationRow({
  item,
  locale,
  onOpen,
}: {
  item: Notification;
  locale: string;
  onOpen: (item: Notification) => void;
}) {
  return (
    <Pressable onPress={() => onOpen(item)} accessibilityRole="button">
      <Card className={item.read ? 'opacity-80' : ''}>
        <Card.Body className="gap-1">
          <View className="flex-row items-start justify-between gap-3">
            <Card.Title className="flex-1">{item.title}</Card.Title>
            {!item.read ? <View className="mt-1 h-2 w-2 rounded-full bg-accent" /> : null}
          </View>
          <Card.Description>{item.message}</Card.Description>
          <Text className="text-sm text-muted">{formatTimestamp(item.createdAt, locale)}</Text>
        </Card.Body>
      </Card>
    </Pressable>
  );
}

export function NotificationsScreen() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const muted = useThemeColor('muted');
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const docs = await fetchNotifications();
      setItems(docs);
    } catch {
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  const onOpenNotification = async (item: Notification): Promise<void> => {
    if (!item.read) {
      await markNotificationRead(item.id);
      setItems((current) =>
        current.map((row) => (row.id === item.id ? { ...row, read: true } : row)),
      );
    }
    openNotificationActionUrl(item.actionUrl);
  };

  if (!user) {
    return (
      <Screen horizontalPadding={TAB_SCREEN_HORIZONTAL_PADDING}>
        <View style={{ gap: 16, flex: 1 }}>
          <ScreenBackChrome onBack={() => router.back()} accessibilityLabel={t('listing.back')} />
          <GuestAuthCard
            icon={<Ionicons name="notifications-outline" size={28} color={muted} />}
            headline={t('notifications.guestTitle')}
            description={t('notifications.guestDescription')}
            ctaLabel={t('favorites.signInCta')}
            onPress={() => navigateToAuthStart()}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen horizontalPadding={TAB_SCREEN_HORIZONTAL_PADDING}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          gap: 12,
          paddingBottom: TAB_SCREEN_CONTENT_BOTTOM_PADDING,
        }}
      >
        <ScreenBackChrome onBack={() => router.back()} accessibilityLabel={t('listing.back')} />
        <TabScreenHeader title={t('notifications.title')} />

        {loading ? (
          <View className="gap-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </View>
        ) : null}

        {error ? (
          <Card>
            <Card.Body>
              <Card.Description>{t('notifications.loadFailed')}</Card.Description>
            </Card.Body>
          </Card>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <EmptyList
            icon={<Ionicons name="notifications-outline" size={28} color={muted} />}
            title={t('notifications.emptyTitle')}
            description={t('notifications.emptyDescription')}
          />
        ) : null}

        {items.map((item) => (
          <NotificationRow key={item.id} item={item} locale={locale} onOpen={onOpenNotification} />
        ))}
      </ScrollView>
    </Screen>
  );
}
