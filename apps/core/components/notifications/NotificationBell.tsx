import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

import type { AppColorPalette } from '~/lib/theme/types';
import { useUnreadCount } from '~/lib/hooks/useNotifications';
import { useAppColors } from '~/lib/theme';

interface NotificationBellProps {
  disabled?: boolean;
}

function createStyles(colors: AppColorPalette) {
  return StyleSheet.create({
    container: {
      marginRight: 16,
    },
    iconContainer: {
      position: 'relative',
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor: colors.white,
    },
    badgeText: {
      color: colors.white,
      fontSize: 11,
      fontWeight: 'bold',
    },
  });
}

export function NotificationBell({ disabled = false }: NotificationBellProps) {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: unreadCount = 0 } = useUnreadCount();

  const handlePress = () => {
    if (disabled) return;
    router.push('/(modals)/notifications');
  };

  const iconColor = disabled ? colors.icon.muted : colors.icon.active;

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
          size={24}
          color={iconColor}
        />
        {unreadCount > 0 && !disabled && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
