import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPayloadSdk, payloadSdkTry } from '../api/payloadSdk'
import { useAuth } from '../providers/AuthProvider'

export interface Notification {
  id: string
  user: string | any
  type: 'photo_request' | 'photo_approved' | 'photo_rejected' | 'review' | 'favorite' | 'claim_approved' | 'claim_rejected' | 'system'
  title: string
  message: string
  read: boolean
  data?: Record<string, any>
  actionUrl?: string
  createdAt: string
  updatedAt: string
}

/**
 * Fetch user's notifications (sorted by date, newest first)
 */
export function useNotifications() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await payloadSdkTry(() =>
        getPayloadSdk().find({
          collection: 'notifications',
          where: {
            user: {
              equals: user.id,
            },
          },
          sort: '-createdAt',
          limit: 100,
          depth: 1,
        })
      )

      if (error) {
        console.error('[useNotifications] Error fetching notifications:', error)
        throw new Error(error.message)
      }

      return (data?.docs || []) as Notification[]
    },
    enabled: !!user,
    staleTime: 1000 * 30, // 30 seconds
  })
}

/**
 * Get count of unread notifications
 */
export function useUnreadCount() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      if (!user) return 0

      const { data, error } = await payloadSdkTry(() =>
        getPayloadSdk().find({
          collection: 'notifications',
          where: {
            and: [
              { user: { equals: user.id } },
              { read: { equals: false } },
            ],
          },
          limit: 0, // We only need totalDocs
        })
      )

      if (error) {
        console.error('[useUnreadCount] Error fetching count:', error)
        return 0
      }

      return data?.totalDocs || 0
    },
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30 seconds
  })
}

/**
 * Mark a notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await payloadSdkTry(() =>
        getPayloadSdk().update({
          collection: 'notifications',
          id: notificationId,
          data: { read: true },
        })
      )

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      // Invalidate both queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })
}

/**
 * Mark all user's notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated')

      // Fetch all unread notifications
      const { data, error } = await payloadSdkTry(() =>
        getPayloadSdk().find({
          collection: 'notifications',
          where: {
            and: [
              { user: { equals: user.id } },
              { read: { equals: false } },
            ],
          },
          limit: 1000,
        })
      )

      if (error) {
        throw new Error(error.message)
      }

      const unreadNotifications = data?.docs || []

      // Mark each as read
      const sdk = getPayloadSdk()
      await Promise.all(
        unreadNotifications.map((notification: Notification) =>
          sdk.update({
            collection: 'notifications',
            id: notification.id,
            data: { read: true },
          })
        )
      )

      return unreadNotifications.length
    },
    onSuccess: (count) => {
      console.log(`[useMarkAllAsRead] Marked ${count} notifications as read`)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })
}



