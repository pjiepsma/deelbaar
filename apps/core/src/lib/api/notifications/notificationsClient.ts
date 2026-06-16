import { getPayloadSdk } from '../payloadSdk';
import type { Notification } from '../../types/payload-generated';

export async function fetchNotifications(): Promise<Notification[]> {
  const sdk = getPayloadSdk();
  const result = await sdk.find({
    collection: 'notifications',
    sort: '-createdAt',
    limit: 50,
    depth: 0,
  });
  return result.docs;
}

export async function markNotificationRead(notificationId: number | string): Promise<Notification> {
  const sdk = getPayloadSdk();
  return sdk.update({
    collection: 'notifications',
    id: notificationId,
    data: {
      read: true,
    },
  });
}
