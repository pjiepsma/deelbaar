import type { CollectionConfig } from 'payload'

export const Wishes: CollectionConfig = {
  slug: 'wishes',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (!user) return false
      return {
        created_by: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return {
        created_by: {
          equals: user.id,
        },
      }
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'What are you looking for? (e.g., "Tampons", "The Great Gatsby", "Drill")',
      },
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Book', value: 'book' },
        { label: 'Hygiene', value: 'hygiene' },
        { label: 'Tool', value: 'tool' },
        { label: 'Food', value: 'food' },
        { label: 'Clothing', value: 'clothing' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        description: 'What type of item is this?',
      },
    },
    {
      name: 'author',
      type: 'text',
      admin: {
        description: 'Author name (for books)',
        condition: (data) => data.category === 'book',
      },
    },
    {
      name: 'isbn',
      type: 'text',
      admin: {
        description: 'ISBN number (for books)',
        condition: (data) => data.category === 'book',
      },
    },
    {
      name: 'brand',
      type: 'text',
      admin: {
        description: 'Brand or manufacturer (optional)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Additional details about what you\'re looking for',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Fulfilled', value: 'fulfilled' },
        { label: 'Archived', value: 'archived' },
      ],
      index: true,
    },
    {
      name: 'location',
      type: 'group',
      fields: [
        {
          name: 'latitude',
          type: 'number',
          required: true,
        },
        {
          name: 'longitude',
          type: 'number',
          required: true,
        },
        {
          name: 'radius',
          type: 'number',
          required: true,
          defaultValue: 50,
          admin: {
            description: 'Notification radius in kilometers',
          },
        },
        {
          name: 'radiusMeters',
          type: 'number',
          admin: {
            description: 'Canonical radius in meters',
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'created_by',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        readOnly: true,
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create' && req.user) {
          data.created_by = req.user.id
        }

        if (data?.location && typeof data.location.radius === 'number') {
          data.location.radiusMeters = Math.round(data.location.radius * 1000)
        }

        return data
      },
    ],
  },
}



