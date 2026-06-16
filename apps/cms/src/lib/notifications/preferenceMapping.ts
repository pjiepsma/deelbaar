import type { NotificationEventType } from './notificationTypes'

const PREFERENCE_KEY_BY_TYPE: Partial<Record<NotificationEventType, string>> = {
  photo_request: 'photoRequests',
  photo_approved: 'statusUpdates',
  photo_rejected: 'statusUpdates',
  review: 'reviews',
  favorite: 'favorites',
}

export function getPreferenceKeyForType(type: NotificationEventType): string | null {
  return PREFERENCE_KEY_BY_TYPE[type] ?? null
}

export function isNotificationTypeDisabled(
  type: NotificationEventType,
  notificationSettings: Record<string, boolean | null | undefined> | null | undefined,
): boolean {
  const settingKey = getPreferenceKeyForType(type)
  if (!settingKey) {
    return false
  }
  return notificationSettings?.[settingKey] === false
}
