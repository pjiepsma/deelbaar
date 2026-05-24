import type { CollectionConfig } from 'payload'
import { MAP_PLACE_RELATION_TO } from '../constants/mapPlaces'
import { assertPlaceInteractionAllowed } from '../lib/placeInteractionScope'

const FOLLOW_TARGET_OPTIONS = [
  { label: 'Place', value: 'place' },
  { label: 'Area', value: 'area' },
] as const

export const Follows: CollectionConfig = {
  slug: 'follows',
  admin: {
    useAsTitle: 'targetType',
    defaultColumns: ['targetType', 'user', 'place', 'active', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
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
    },
    {
      name: 'targetType',
      type: 'select',
      required: true,
      options: FOLLOW_TARGET_OPTIONS,
      defaultValue: 'place',
      index: true,
    },
    {
      name: 'place',
      type: 'relationship',
      relationTo: MAP_PLACE_RELATION_TO,
      admin: {
        condition: (_, siblingData) => siblingData?.targetType === 'place',
      },
      index: true,
    },
    {
      name: 'area',
      type: 'group',
      admin: {
        condition: (_, siblingData) => siblingData?.targetType === 'area',
      },
      fields: [
        { name: 'name', type: 'text' },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'radiusMeters', type: 'number' },
      ],
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      index: true,
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (!data) return data

        if (operation === 'create' && req.user && !data.user) {
          data.user = req.user.id
        }

        if (data.targetType === 'listing') {
          data.targetType = 'place'
        }

        if (data.targetType === 'place' && !data.place) {
          throw new Error('place is required when targetType is place')
        }
        if (data.targetType === 'place' && data.place) {
          await assertPlaceInteractionAllowed(req, data.place, 'follow')
        }

        if (data.targetType === 'area') {
          const area = data.area ?? {}
          if (
            typeof area.latitude !== 'number' ||
            typeof area.longitude !== 'number' ||
            typeof area.radiusMeters !== 'number'
          ) {
            throw new Error('area latitude, longitude and radiusMeters are required for area follows')
          }
        }

        return data
      },
    ],
  },
  timestamps: true,
}
