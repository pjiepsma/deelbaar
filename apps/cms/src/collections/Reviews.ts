import type { CollectionConfig } from 'payload'
import NotificationService from '../lib/notificationService'

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
      name: 'created_by',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'listing',
      type: 'relationship',
      relationTo: 'listings',
      required: true,
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        try {
          if (operation === 'create') {
            const notificationService = new NotificationService(req.payload)

            // Send notification to listing owner about new review
            if (doc.listing && typeof doc.listing === 'object') {
              const listing = doc.listing as any
              const listingOwnerId = typeof listing.owner === 'string' ? listing.owner : listing.owner?.id

              if (listingOwnerId && doc.created_by && typeof doc.created_by === 'object') {
                const reviewer = doc.created_by as any
                const reviewerName = reviewer.name || reviewer.email || 'Iemand'

                await notificationService.notifyReview(
                  listingOwnerId,
                  reviewerName,
                  listing.name || 'Listing',
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



