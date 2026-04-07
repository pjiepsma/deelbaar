import { Payload } from 'payload'

export interface NotificationData {
  title: string
  body: string
  data?: Record<string, any>
  ttl?: number
  priority?: 'default' | 'normal' | 'high'
}

interface CreateNotificationParams {
  userId: string
  type: 'photo_request' | 'photo_approved' | 'photo_rejected' | 'review' | 'favorite' | 'claim_approved' | 'claim_rejected'
  title: string
  message: string
  data?: Record<string, any>
  actionUrl?: string
}

export class NotificationService {
  constructor(private payload: Payload) {}

  /**
   * Create notification in DB and send push notification
   */
  private async createAndSendNotification(params: CreateNotificationParams): Promise<boolean> {
    const { userId, type, title, message, data, actionUrl } = params

    try {
      // 1. Create database record (permanent)
      const notification = await this.payload.create({
        collection: 'notifications',
        data: {
          user: userId,
          type,
          title,
          message,
          read: false,
          data: data || {},
          actionUrl: actionUrl || '',
        },
      })

      console.log(`[NotificationService] Created notification record:`, notification.id)

      // 2. Get user's push token and settings
      const user = await this.payload.findByID({
        collection: 'users',
        id: userId,
      })

      if (!user) {
        console.log(`[NotificationService] User ${userId} not found`)
        return false
      }

      // Check if user has this notification type enabled
      const notificationSettings = user.notificationSettings || {}
      const settingKey = this.getSettingKeyForType(type)
      
      if (settingKey && notificationSettings[settingKey] === false) {
        console.log(`[NotificationService] User has disabled ${type} notifications`)
        return false
      }

      // 3. Send push notification if user has token
      if (user.pushToken) {
        await this.sendExpoNotification(user.pushToken, {
          title,
          body: message,
          data: data || {},
        })
      } else {
        console.log(`[NotificationService] User ${userId} has no push token`)
      }

      return true
    } catch (error) {
      console.error('[NotificationService] Error creating notification:', error)
      return false
    }
  }

  private getSettingKeyForType(type: string): string | null {
    const mapping: Record<string, string> = {
      photo_request: 'photoRequests',
      photo_approved: 'statusUpdates',
      photo_rejected: 'statusUpdates',
      review: 'reviews',
      favorite: 'favorites',
    }
    return mapping[type] || null
  }

  /**
   * Send push notification to a specific user (legacy method - for backwards compatibility)
   */
  async sendToUser(userId: string, notification: NotificationData): Promise<boolean> {
    try {
      // Get user with push token
      const user = await this.payload.findByID({
        collection: 'users',
        id: userId,
      })

      if (!user?.pushToken) {
        console.log(`No push token found for user ${userId}`)
        return false
      }

      // Check user's notification preferences
      const settings = user.notificationSettings || {}
      const notificationType = notification.data?.type

      if (notificationType && settings[notificationType] === false) {
        console.log(`User ${userId} has disabled ${notificationType} notifications`)
        return false
      }

      return await this.sendExpoNotification(user.pushToken, notification)
    } catch (error) {
      console.error('Failed to send notification to user:', error)
      return false
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToUsers(userIds: string[], notification: NotificationData): Promise<{ success: number, failed: number }> {
    let success = 0
    let failed = 0

    for (const userId of userIds) {
      const result = await this.sendToUser(userId, notification)
      if (result) {
        success++
      } else {
        failed++
      }
    }

    return { success, failed }
  }

  /**
   * Send notification via Expo Push Service
   */
  private async sendExpoNotification(pushToken: string, notification: NotificationData): Promise<boolean> {
    try {
      const expoMessage = {
        to: pushToken,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        ttl: notification.ttl || 86400, // 24 hours default
        priority: notification.priority || 'default',
        sound: 'default',
        badge: 1,
      }

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expoMessage),
      })

      const result = await response.json()

      if (result.data?.status === 'ok') {
        console.log(`Notification sent successfully to ${pushToken}`)
        return true
      } else {
        console.error('Expo notification failed:', result)
        return false
      }
    } catch (error) {
      console.error('Failed to send Expo notification:', error)
      return false
    }
  }

  /**
   * Helper method to send photo request notification
   */
  async notifyPhotoRequest(listingOwnerId: string, requesterName: string, listingName: string, listingId?: string): Promise<boolean> {
    return this.createAndSendNotification({
      userId: listingOwnerId,
      type: 'photo_request',
      title: 'Nieuwe foto aanvraag',
      message: `${requesterName} wil een foto toevoegen aan "${listingName}"`,
      data: { listingName, requesterName, listingId },
      actionUrl: listingId ? `deelbaar://listing/${listingId}` : undefined,
    })
  }

  /**
   * Helper method to send review notification
   */
  async notifyReview(listingOwnerId: string, reviewerName: string, listingName: string, rating: number, listingId?: string): Promise<boolean> {
    const stars = '⭐'.repeat(rating)
    return this.createAndSendNotification({
      userId: listingOwnerId,
      type: 'review',
      title: 'Nieuwe review',
      message: `${reviewerName} gaf ${rating} ⭐ aan "${listingName}"`,
      data: { listingName, reviewerName, rating, listingId },
      actionUrl: listingId ? `deelbaar://listing/${listingId}` : undefined,
    })
  }

  /**
   * Helper method to send favorite notification
   */
  async notifyFavorite(listingOwnerId: string, favoriterName: string, listingName: string, listingId?: string): Promise<boolean> {
    return this.createAndSendNotification({
      userId: listingOwnerId,
      type: 'favorite',
      title: 'Nieuwe favoriet ❤️',
      message: `${favoriterName} heeft "${listingName}" toegevoegd aan favorieten`,
      data: { listingName, favoriterName, listingId },
      actionUrl: listingId ? `deelbaar://listing/${listingId}` : undefined,
    })
  }

  /**
   * Helper method to send photo status update
   */
  async notifyPhotoStatus(userId: string, listingName: string, status: 'approved' | 'rejected', listingId?: string, reason?: string): Promise<boolean> {
    const title = status === 'approved' ? 'Foto goedgekeurd' : 'Foto afgewezen'
    const message = status === 'approved'
      ? `Je foto voor "${listingName}" is goedgekeurd en zichtbaar!`
      : `Je foto voor "${listingName}" is afgewezen.${reason ? ` Reden: ${reason}` : ''}`

    return this.createAndSendNotification({
      userId,
      type: status === 'approved' ? 'photo_approved' : 'photo_rejected',
      title,
      message,
      data: { listingName, status, reason, listingId },
      actionUrl: listingId ? `deelbaar://listing/${listingId}` : undefined,
    })
  }

  /**
   * Helper method to send claim approval notification
   */
  async notifyClaimApproved(userId: string, listingName: string, listingId?: string): Promise<boolean> {
    return this.createAndSendNotification({
      userId,
      type: 'claim_approved',
      title: 'Claim goedgekeurd! 🎉',
      message: `Je claim voor "${listingName}" is goedgekeurd. Je bent nu eigenaar van deze listing.`,
      data: { listingName, listingId },
      actionUrl: listingId ? `deelbaar://listing/${listingId}` : undefined,
    })
  }

  /**
   * Helper method to send claim rejection notification
   */
  async notifyClaimRejected(userId: string, listingName: string, reason?: string): Promise<boolean> {
    return this.createAndSendNotification({
      userId,
      type: 'claim_rejected',
      title: 'Claim afgewezen',
      message: `Je claim voor "${listingName}" is afgewezen.${reason ? ` Reden: ${reason}` : ''}`,
      data: { listingName, reason },
    })
  }
}

export default NotificationService






