import type { CollectionConfig } from 'payload'

const ENTITLEMENT_SCOPE_OPTIONS = [
  { label: 'City', value: 'city' },
  { label: 'Province', value: 'province' },
  { label: 'Country', value: 'country' },
  { label: 'World', value: 'world' },
] as const

const ENTITLEMENT_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Expired', value: 'expired' },
  { label: 'Revoked', value: 'revoked' },
] as const

export const Entitlements: CollectionConfig = {
  slug: 'entitlements',
  admin: {
    useAsTitle: 'scope',
    defaultColumns: ['user', 'scope', 'status', 'expiresAt'],
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
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
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
      name: 'scope',
      type: 'select',
      required: true,
      options: ENTITLEMENT_SCOPE_OPTIONS,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: ENTITLEMENT_STATUS_OPTIONS,
      index: true,
    },
    {
      name: 'source',
      type: 'text',
      required: true,
      defaultValue: 'manual',
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        description: 'Optional expiration. Empty means no expiry.',
      },
      index: true,
    },
    {
      name: 'metadata',
      type: 'json',
    },
  ],
  timestamps: true,
}
