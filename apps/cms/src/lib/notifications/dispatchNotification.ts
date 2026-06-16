import type { Payload } from 'payload'

import { sendFcmToToken } from '../push/fcmClient'
import { isNotificationTypeDisabled } from './preferenceMapping'
import type {
  DeliveryChannel,
  DeliveryStatus,
  DispatchNotificationInput,
  DispatchNotificationResult,
  NotificationEventType,
  NotificationSource,
} from './notificationTypes'

type NotificationUser = {
  id: string | number
  pushToken?: string | null
  pushPlatform?: 'android' | 'ios' | null
  notificationSettings?: Record<string, boolean | null | undefined> | null
}

type DeliveryRowInput = {
  source: NotificationSource
  campaignId?: string | number
  recipientId: string | number
  channel: DeliveryChannel
  status: DeliveryStatus
  skipReason?: string
  errorMessage?: string
  titleSnapshot: string
  bodySnapshot: string
  eventType: NotificationEventType
  inboxNotificationId?: string | number
}

function stringifyNotificationData(
  data: Record<string, unknown> | undefined,
): Record<string, string> | undefined {
  if (!data) {
    return undefined
  }

  const stringData: Record<string, string> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      continue
    }
    stringData[key] = typeof value === 'string' ? value : JSON.stringify(value)
  }
  return stringData
}

async function createDeliveryRow(payload: Payload, input: DeliveryRowInput): Promise<void> {
  await payload.create({
    collection: 'notification-deliveries',
    overrideAccess: true,
    data: {
      source: input.source,
      campaign: input.campaignId,
      recipient: input.recipientId,
      channel: input.channel,
      status: input.status,
      skipReason: input.skipReason,
      errorMessage: input.errorMessage,
      titleSnapshot: input.titleSnapshot,
      bodySnapshot: input.bodySnapshot,
      eventType: input.eventType,
      inboxNotification: input.inboxNotificationId,
    },
  })
}

async function clearUserPushToken(payload: Payload, userId: string | number): Promise<void> {
  await payload.update({
    collection: 'users',
    id: userId,
    overrideAccess: true,
    data: {
      pushToken: null,
      pushPlatform: null,
      pushTokenUpdatedAt: null,
    },
  })
}

export async function dispatchNotification(
  payload: Payload,
  input: DispatchNotificationInput,
): Promise<DispatchNotificationResult> {
  const result: DispatchNotificationResult = {
    inboxCreated: false,
    pushAttempted: false,
    pushSent: false,
    pushFailed: false,
    skippedNoToken: false,
    skippedPreference: false,
  }

  const user = (await payload.findByID({
    collection: 'users',
    id: input.recipientId,
    depth: 0,
    overrideAccess: true,
  })) as NotificationUser | null

  if (!user) {
    throw new Error(`dispatchNotification: user ${input.recipientId} not found`)
  }

  if (isNotificationTypeDisabled(input.type, user.notificationSettings)) {
    await createDeliveryRow(payload, {
      source: input.source,
      campaignId: input.campaignId,
      recipientId: user.id,
      channel: 'in_app',
      status: 'skipped',
      skipReason: 'preference',
      titleSnapshot: input.title,
      bodySnapshot: input.message,
      eventType: input.type,
    })
    result.skippedPreference = true
    return result
  }

  const notification = await payload.create({
    collection: 'notifications',
    overrideAccess: true,
    data: {
      user: user.id,
      type: input.type,
      title: input.title,
      message: input.message,
      read: false,
      data: input.data ?? {},
      actionUrl: input.actionUrl ?? '',
      campaign: input.campaignId,
    },
  })

  result.inboxCreated = true

  await createDeliveryRow(payload, {
    source: input.source,
    campaignId: input.campaignId,
    recipientId: user.id,
    channel: 'in_app',
    status: 'sent',
    titleSnapshot: input.title,
    bodySnapshot: input.message,
    eventType: input.type,
    inboxNotificationId: notification.id,
  })

  const pushToken = user.pushToken
  if (!pushToken) {
    await createDeliveryRow(payload, {
      source: input.source,
      campaignId: input.campaignId,
      recipientId: user.id,
      channel: 'fcm_android',
      status: 'skipped',
      skipReason: 'no_token',
      titleSnapshot: input.title,
      bodySnapshot: input.message,
      eventType: input.type,
      inboxNotificationId: notification.id,
    })
    result.skippedNoToken = true
    return result
  }

  if (user.pushPlatform !== 'android') {
    await createDeliveryRow(payload, {
      source: input.source,
      campaignId: input.campaignId,
      recipientId: user.id,
      channel: 'fcm_android',
      status: 'skipped',
      skipReason: 'ios_not_configured',
      titleSnapshot: input.title,
      bodySnapshot: input.message,
      eventType: input.type,
      inboxNotificationId: notification.id,
    })
    result.skippedNoToken = true
    return result
  }

  result.pushAttempted = true

  const fcmResult = await sendFcmToToken(pushToken, {
    title: input.title,
    body: input.message,
    data: {
      ...stringifyNotificationData(input.data),
      ...(input.actionUrl ? { actionUrl: input.actionUrl } : {}),
    },
  })

  if (fcmResult.ok) {
    await createDeliveryRow(payload, {
      source: input.source,
      campaignId: input.campaignId,
      recipientId: user.id,
      channel: 'fcm_android',
      status: 'sent',
      titleSnapshot: input.title,
      bodySnapshot: input.message,
      eventType: input.type,
      inboxNotificationId: notification.id,
    })
    result.pushSent = true
    return result
  }

  if (fcmResult.reason === 'token-not-registered' && fcmResult.clearToken) {
    await clearUserPushToken(payload, user.id)
  }

  await createDeliveryRow(payload, {
    source: input.source,
    campaignId: input.campaignId,
    recipientId: user.id,
    channel: 'fcm_android',
    status: 'failed',
    errorMessage: fcmResult.reason,
    titleSnapshot: input.title,
    bodySnapshot: input.message,
    eventType: input.type,
    inboxNotificationId: notification.id,
  })
  result.pushFailed = true
  return result
}
