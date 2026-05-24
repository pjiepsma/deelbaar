import type { CollectionConfig } from 'payload'
import { MAP_PLACE_RELATION_TO } from '../constants/mapPlaces'
import NotificationService from '../lib/notificationService'
import { findPlaceByReference } from '../lib/mapPlaces'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user }, data }) => {
      if (!user) return false
      return user.id === data?.created_by
    },
    delete: ({ req: { user }, data }) => {
      if (!user) return false
      return user.id === data?.created_by
    },
  },
  fields: [
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'photos',
      type: 'array',
      fields: [
        {
          name: 'photo',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'created_by',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'place',
      type: 'relationship',
      relationTo: MAP_PLACE_RELATION_TO,
      required: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'published',
      index: true,
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Hidden', value: 'hidden' },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        try {
          if (operation === 'create') {
            const notificationService = new NotificationService(req.payload)

            // Send notification to place owner about new review
            if (doc.place) {
              const place = await findPlaceByReference(req.payload, doc.place)
              const ownerRef = place.owner as unknown
              const listingOwnerId =
                typeof ownerRef === 'string' || typeof ownerRef === 'number'
                  ? String(ownerRef)
                  : ownerRef && typeof ownerRef === 'object' && 'id' in ownerRef
                    ? String((ownerRef as { id: string | number }).id)
                    : null

              if (listingOwnerId && doc.created_by && typeof doc.created_by === 'object') {
                const reviewer = doc.created_by as any
                const reviewerName = reviewer.name || reviewer.email || 'Iemand'

                await notificationService.notifyReview(
                  listingOwnerId,
                  reviewerName,
                  String(place.name || 'Place'),
                  doc.rating
                )
              }
            }
          }
        } catch (error) {
          console.error('Failed to send review notification:', error)
          // Don't throw error to prevent the operation from failing
        }

        return doc
      },
    ],
  },
  timestamps: true,
}



