import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import { useUnreadCount } from '~/lib/hooks/useNotifications'
import Colors from '~/constants/Colors'

export function NotificationBell() {
  const router = useRouter()
  const { data: unreadCount = 0 } = useUnreadCount()

  const handlePress = () => {
    router.push('/(modals)/notifications')
  }

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
          size={24}
          color={Colors.text.primary}
        />
        {unreadCount > 0 && (
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



