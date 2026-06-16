import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'
import { NOTIFICATION_EVENT_TYPES } from '../lib/notifications/notificationTypes'

export const NotificationDeliveries: CollectionConfig = {
  slug: 'notification-deliveries',
  admin: {
    useAsTitle: 'titleSnapshot',
    group: 'Admin',
    defaultColumns: ['recipient', 'channel', 'status', 'eventType', 'source', 'createdAt'],
    description: 'Audit log of every notification delivery attempt (in-app and push).',
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'source',
      type: 'select',
      required: true,
      options: [
        { label: 'Campaign', value: 'campaign' },
        { label: 'Event', value: 'event' },
      ],
    },
    {
      name: 'campaign',
      type: 'relationship',
      relationTo: 'push-campaigns',
    },
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'inboxNotification',
      type: 'relationship',
      relationTo: 'notifications',
    },
    {
      name: 'channel',
      type: 'select',
      required: true,
      options: [
        { label: 'In-app', value: 'in_app' },
        { label: 'FCM Android', value: 'fcm_android' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
        { label: 'Skipped', value: 'skipped' },
      ],
    },
    {
      name: 'skipReason',
      type: 'text',
    },
    {
      name: 'errorMessage',
      type: 'text',
    },
    {
      name: 'titleSnapshot',
      type: 'text',
      required: true,
    },
    {
      name: 'bodySnapshot',
      type: 'textarea',
      required: true,
    },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      options: NOTIFICATION_EVENT_TYPES.map((value) => ({ label: value, value })),
    },
  ],
  timestamps: true,
}
