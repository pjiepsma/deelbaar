import { Payload } from 'payload'

import { dispatchNotification } from './notifications/dispatchNotification'
import type { NotificationEventType } from './notifications/notificationTypes'

export interface NotificationData {
  title: string
  body: string
  data?: Record<string, string>
  ttl?: number
  priority?: 'default' | 'normal' | 'high'
}

interface CreateNotificationParams {
  userId: string
  type: NotificationEventType
  title: string
  message: string
  data?: Record<string, unknown>
  actionUrl?: string
}

export class NotificationService {
  constructor(private payload: Payload) {}

  private async createAndSendNotification(params: CreateNotificationParams): Promise<boolean> {
    const { userId, type, title, message, data, actionUrl } = params

    try {
      const result = await dispatchNotification(this.payload, {
        recipientId: userId,
        type,
        title,
        message,
        data,
        actionUrl,
        source: 'event',
      })

      return result.inboxCreated || result.pushSent
    } catch (error) {
      console.error('[NotificationService] Error creating notification:', error)
      return false
    }
  }

  async sendToUser(userId: string, notification: NotificationData): Promise<boolean> {
    try {
      const result = await dispatchNotification(this.payload, {
        recipientId: userId,
        type: 'system',
        title: notification.title,
        message: notification.body,
        data: notification.data,
        source: 'event',
      })

      return result.pushSent
    } catch (error) {
      console.error('Failed to send notification to user:', error)
      return false
    }
  }

  async sendToUsers(userIds: string[], notification: NotificationData): Promise<{ success: number; failed: number }> {
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

  async notifyPhotoRequest(
    listingOwnerId: string,
    requesterName: string,
    listingName: string,
    listingId?: string,
  ): Promise<boolean> {
    return this.createAndSendNotification({
      userId: listingOwnerId,
      type: 'photo_request',
      title: 'Nieuwe foto aanvraag',
      message: `${requesterName} wil een foto toevoegen aan "${listingName}"`,
      data: { listingName, requesterName, listingId },
      actionUrl: listingId ? `deelbaar://listing/${listingId}` : undefined,
    })
  }

  async notifyReview(
    listingOwnerId: string,
    reviewerName: string,
    listingName: string,
    rating: number,
    listingId?: string,
  ): Promise<boolean> {
    return this.createAndSendNotification({
      userId: listingOwnerId,
      type: 'review',
      title: 'Nieuwe review',
      message: `${reviewerName} gaf ${rating} ⭐ aan "${listingName}"`,
      data: { listingName, reviewerName, rating, listingId },
      actionUrl: listingId ? `deelbaar://listing/${listingId}` : undefined,
    })
  }

  async notifyFavorite(
    listingOwnerId: string,
    favoriterName: string,
    listingName: string,
    listingId?: string,
  ): Promise<boolean> {
    return this.createAndSendNotification({
      userId: listingOwnerId,
      type: 'favorite',
      title: 'Nieuwe favoriet ❤️',
      message: `${favoriterName} heeft "${listingName}" toegevoegd aan favorieten`,
      data: { listingName, favoriterName, listingId },
      actionUrl: listingId ? `deelbaar://listing/${listingId}` : undefined,
    })
  }

  async notifyPhotoStatus(
    userId: string,
    listingName: string,
    status: 'approved' | 'rejected',
    listingId?: string,
    reason?: string,
  ): Promise<boolean> {
    const title = status === 'approved' ? 'Foto goedgekeurd' : 'Foto afgewezen'
    const message =
      status === 'approved'
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
