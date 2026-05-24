import type { CollectionConfig } from 'payload'
import { MAP_PLACE_RELATION_TO } from '../constants/mapPlaces'

const REPORT_TARGET_OPTIONS = [
  { label: 'Place', value: 'place' },
  { label: 'Review', value: 'review' },
]

const REPORT_STATUS_OPTIONS = [
  { label: 'Open', value: 'open' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Dismissed', value: 'dismissed' },
]

const REPORT_REASON_OPTIONS = [
  { label: 'Spam', value: 'spam' },
  { label: 'Offensive', value: 'offensive' },
  { label: 'Misleading', value: 'misleading' },
  { label: 'Unsafe', value: 'unsafe' },
  { label: 'Other', value: 'other' },
]

export const Reports: CollectionConfig = {
  slug: 'reports',
  admin: {
    useAsTitle: 'status',
    group: 'Admin',
    defaultColumns: ['targetType', 'status', 'reason', 'createdBy', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        createdBy: {
          equals: user.id,
        },
      }
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'targetType',
      type: 'select',
      required: true,
      options: REPORT_TARGET_OPTIONS,
      index: true,
    },
    {
      name: 'place',
      type: 'relationship',
      relationTo: MAP_PLACE_RELATION_TO,
      index: true,
      admin: {
        condition: (_, siblingData) => siblingData?.targetType === 'place',
      },
    },
    {
      name: 'review',
      type: 'relationship',
      relationTo: 'reviews',
      index: true,
      admin: {
        condition: (_, siblingData) => siblingData?.targetType === 'review',
      },
    },
    {
      name: 'reason',
      type: 'select',
      required: true,
      options: REPORT_REASON_OPTIONS,
      index: true,
    },
    {
      name: 'details',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: REPORT_STATUS_OPTIONS,
      defaultValue: 'open',
      index: true,
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        condition: (_, siblingData) =>
          siblingData?.status === 'in_review' || siblingData?.status === 'resolved',
      },
    },
    {
      name: 'resolutionNote',
      type: 'textarea',
      admin: {
        condition: (_, siblingData) =>
          siblingData?.status === 'resolved' || siblingData?.status === 'dismissed',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data, req, operation }) => {
        if (!data) return data

        if (operation === 'create' && req.user && !data.createdBy) {
          data.createdBy = req.user.id
        }

        if (data.targetType === 'listing') {
          data.targetType = 'place'
        }

        if (data.targetType === 'place' && !data.place) {
          throw new Error('place is required when targetType is place')
        }

        if (data.targetType === 'review' && !data.review) {
          throw new Error('review is required when targetType is review')
        }

        return data
      },
    ],
  },
  timestamps: true,
}
