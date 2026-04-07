import type { CollectionConfig } from 'payload'
import NotificationService from '../lib/notificationService'

export const Requests: CollectionConfig = {
  slug: 'requests',
  admin: {
    useAsTitle: 'listing',
    group: 'Admin',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      // Admins can read all claims, users can read their own claims
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    create: ({ req: { user } }) => !!user, // Any authenticated user can create claims
    update: ({ req: { user } }) => {
      if (!user) return false
      // Admins can update any claim, users can only update their own claims
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      // Only admins can delete claims (for moderation)
      return user.role === 'admin'
    },
  },
  fields: [
    {
      name: 'listing',
      type: 'relationship',
      relationTo: 'listings',
      required: true,
      admin: {
        description: 'The listing being claimed',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'User submitting the claim',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      defaultValue: 'pending',
      required: true,
      admin: {
        description: 'Claim status',
      },
    },
    {
      name: 'distanceMeters',
      type: 'number',
      admin: {
        description: 'Distance in meters from user location to listing (for auto-approval)',
      },
    },
    {
      name: 'addressSnapshot',
      type: 'group',
      admin: {
        description: 'Snapshot of user address at time of claim',
      },
      fields: [
        {
          name: 'street',
          type: 'text',
        },
        {
          name: 'houseNumber',
          type: 'text',
        },
        {
          name: 'postalCode',
          type: 'text',
        },
        {
          name: 'city',
          type: 'text',
        },
        {
          name: 'coordinates',
          type: 'point',
          label: 'Location',
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Additional notes from the user or admin',
      },
    },
  ],
  timestamps: true,
  hooks: {
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        // Only process on update operations when status changes
        if (operation !== 'update' || !previousDoc) {
          return
        }

        const notificationService = new NotificationService(req.payload)

        try {
          // Handle approved claims
          if (doc.status === 'approved' && previousDoc.status !== 'approved') {
            // Update the listing to set owner details
            const listing = await req.payload.update({
              collection: 'listings',
              id: doc.listing,
              data: {
                owner: doc.user,
                pendingOwner: null,
              },
            })

            // Get listing name for notification
            const listingData = typeof listing === 'object' ? listing : await req.payload.findByID({
              collection: 'listings',
              id: doc.listing,
            })

            const listingName = listingData?.name || 'Unknown listing'
            const listingId = typeof doc.listing === 'string' ? doc.listing : doc.listing.id

            // Send approval notification to user
            await notificationService.notifyClaimApproved(
              typeof doc.user === 'string' ? doc.user : doc.user.id,
              listingName,
              listingId
            )

            // Update other pending claims for this listing to rejected
            const otherPendingClaims = await req.payload.find({
              collection: 'requests',
              where: {
                and: [
                  { listing: { equals: doc.listing } },
                  { status: { equals: 'pending' } },
                  { id: { not_equals: doc.id } },
                ],
              },
            })

            // Reject other claims and notify users
            for (const claim of otherPendingClaims.docs) {
              await req.payload.update({
                collection: 'requests',
                id: claim.id,
                data: {
                  status: 'rejected',
                  notes: 'Another claim was approved for this listing',
                },
              })

              // Send rejection notification
              await notificationService.notifyClaimRejected(
                typeof claim.user === 'string' ? claim.user : claim.user.id,
                listingName,
                'Another claim was approved for this listing'
              )
            }
          }

          // Handle rejected claims
          if (doc.status === 'rejected' && previousDoc.status !== 'rejected') {
            // Get listing name for notification
            const listingData = await req.payload.findByID({
              collection: 'listings',
              id: doc.listing,
            })

            const listingName = listingData?.name || 'Unknown listing'

            // Send rejection notification to user
            await notificationService.notifyClaimRejected(
              typeof doc.user === 'string' ? doc.user : doc.user.id,
              listingName,
              doc.notes
            )
          }
        } catch (error) {
          console.error('Error processing claim status change:', error)
        }
      },
    ],
  },
}



