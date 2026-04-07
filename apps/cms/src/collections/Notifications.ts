import type { CollectionConfig } from 'payload'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'user', 'type', 'read', 'createdAt'],
  },
  access: {
    read: ({ req: { user }, data }) => {
      if (!user) return false
      // Admins can read all notifications
      if (user.role === 'admin') return true

      // When a single document is loaded, verify ownership directly (Payload 3.81+: `data`, not `doc`)
      if (data) {
        const docUserId = typeof data.user === 'string' ? data.user : data.user?.id
        return docUserId === user.id
      }

      // List / count: restrict queries to the current user
      return {
        user: {
          equals: user.id,
        },
      }
    },
    create: ({ req: { user } }) => {
      // Only admins can manually create notifications
      // System creates them via hooks
      return user?.role === 'admin'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      // Users can only update their own notifications (to mark as read)
      return {
        user: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      // Users can delete their own notifications
      return {
        user: {
          equals: user.id,
        },
      }
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        description: 'User who receives this notification',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Photo Request', value: 'photo_request' },
        { label: 'Photo Approved', value: 'photo_approved' },
        { label: 'Photo Rejected', value: 'photo_rejected' },
        { label: 'New Review', value: 'review' },
        { label: 'New Favorite', value: 'favorite' },
        { label: 'Claim Approved', value: 'claim_approved' },
        { label: 'Claim Rejected', value: 'claim_rejected' },
        { label: 'System', value: 'system' },
      ],
      admin: {
        description: 'Type of notification',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Notification title',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Notification message body',
      },
    },
    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        description: 'Whether user has read this notification',
      },
    },
    {
      name: 'data',
      type: 'json',
      admin: {
        description: 'Additional data (IDs, URLs, etc.) for deep linking',
      },
    },
    {
      name: 'actionUrl',
      type: 'text',
      admin: {
        description: 'Deep link URL for mobile app (e.g., deelbaar://listing/123)',
      },
    },
  ],
  timestamps: true,
}



