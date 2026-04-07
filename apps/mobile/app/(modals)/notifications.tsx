import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  type Notification,
} from '~/lib/hooks/useNotifications'
import Colors from '~/constants/Colors'

export default function NotificationsScreen() {
  const router = useRouter()
  const { data: notifications = [], isLoading, refetch, isRefetching } = useNotifications()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead.mutateAsync(notification.id)
    }

    // Navigate based on actionUrl or data
    if (notification.actionUrl) {
      // Handle deep link navigation
      const listingIdMatch = notification.actionUrl.match(/listing\/([^/]+)/)
      if (listingIdMatch) {
        router.push(`/(modals)/listing/${listingIdMatch[1]}` as any)
      }
    }
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'photo_request':
        return { name: 'camera' as const, color: Colors.primary }
      case 'photo_approved':
        return { name: 'checkmark-circle' as const, color: Colors.success }
      case 'photo_rejected':
        return { name: 'close-circle' as const, color: Colors.error }
      case 'review':
        return { name: 'star' as const, color: Colors.warning }
      case 'favorite':
        return { name: 'heart' as const, color: Colors.accent }
      case 'claim_approved':
        return { name: 'trophy' as const, color: Colors.success }
      case 'claim_rejected':
        return { name: 'alert-circle' as const, color: Colors.error }
      default:
        return { name: 'notifications' as const, color: Colors.info }
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Nu'
    if (diffMins < 60) return `${diffMins}m geleden`
    if (diffHours < 24) return `${diffHours}u geleden`
    if (diffDays < 7) return `${diffDays}d geleden`
    
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  }

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type)

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.iconCircle, { backgroundColor: icon.color + '15' }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>

        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, !item.read && styles.unreadText]}>
            {item.title}
          </Text>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>{formatTimeAgo(item.createdAt)}</Text>
        </View>

        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={64} color={Colors.text.tertiary} />
      <Text style={styles.emptyTitle}>Geen notificaties</Text>
      <Text style={styles.emptyText}>
        Je ontvangt hier meldingen over je listings, reviews, en favorieten.
      </Text>
    </View>
  )

  const unreadCount = notifications.filter((n) => !n.read).length

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaties</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
            style={styles.markAllButton}
          >
            <Text style={styles.markAllText}>Alles gelezen</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: Colors.primary + '08',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '700',
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 6,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 8,
    marginTop: 6,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
})



