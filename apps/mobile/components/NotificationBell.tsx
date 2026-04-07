import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import { useUnreadCount } from '~/lib/hooks/useNotifications'
import Colors from '~/constants/Colors'

interface NotificationBellProps {
  disabled?: boolean;
}

export function NotificationBell({ disabled = false }: NotificationBellProps) {
  const router = useRouter()
  const { data: unreadCount = 0 } = useUnreadCount()

  const handlePress = () => {
    if (disabled) return;
    router.push('/(modals)/notifications')
  }

  const iconColor = disabled ? '#9ca3af' : Colors.text.primary;

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
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
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
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
})



