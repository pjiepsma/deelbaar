export const NOTIFICATION_EVENT_TYPES = [
  'photo_request',
  'photo_approved',
  'photo_rejected',
  'review',
  'favorite',
  'claim_approved',
  'claim_rejected',
  'new_follower',
  'area_match',
  'report_update',
  'system',
] as const

export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number]

export type NotificationSource = 'campaign' | 'event'

export type DeliveryChannel = 'in_app' | 'fcm_android'

export type DeliveryStatus = 'sent' | 'failed' | 'skipped'

export const PUSH_CAMPAIGN_QUEUE = 'push-campaigns'

export const USERS_PAGE_SIZE = 100

export type DispatchNotificationInput = {
  recipientId: string | number
  type: NotificationEventType
  title: string
  message: string
  actionUrl?: string
  data?: Record<string, unknown>
  source: NotificationSource
  campaignId?: string | number
}

export type DispatchNotificationResult = {
  inboxCreated: boolean
  pushAttempted: boolean
  pushSent: boolean
  pushFailed: boolean
  skippedNoToken: boolean
  skippedPreference: boolean
}
