import type { CollectionConfig } from 'payload'
import NotificationService from '../lib/notificationService'
import { MAP_PLACE_RELATION_TO } from '../constants/mapPlaces'
import { findPlaceByReference, getPlaceCollection, getPlaceId } from '../lib/mapPlaces'
import { assertPlaceInteractionAllowed } from '../lib/placeInteractionScope'

export const Requests: CollectionConfig = {
  slug: 'requests',
  admin: {
    useAsTitle: 'place',
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
      name: 'place',
      type: 'relationship',
      relationTo: MAP_PLACE_RELATION_TO,
      required: true,
      index: true,
      admin: {
        description: 'The place being claimed',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        description: 'User submitting the claim',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Under Review', value: 'under_review' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      defaultValue: 'pending',
      required: true,
      index: true,
      admin: {
        description: 'Claim status',
      },
    },
    {
      name: 'distanceMeters',
      type: 'number',
      admin: {
        description: 'Distance in meters from user location to place (for auto-approval)',
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
        {
          name: 'latitude',
          type: 'number',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'longitude',
          type: 'number',
          admin: {
            readOnly: true,
          },
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
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (!data) {
          return data
        }
        const coordinates = data?.addressSnapshot?.coordinates
        if (Array.isArray(coordinates) && coordinates.length === 2) {
          data.addressSnapshot.latitude = coordinates[1]
          data.addressSnapshot.longitude = coordinates[0]
        }
        if (operation === 'create' && data?.place) {
          await assertPlaceInteractionAllowed(req, data.place, 'request')
        }
        return data
      },
    ],
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
            const placeCollection = getPlaceCollection(doc.place)
            const placeId = getPlaceId(doc.place)

            // Update the place to set owner details
            const place = await req.payload.update({
              collection: placeCollection,
              id: placeId,
              data: {
                owner: doc.user,
                pendingOwner: null,
              },
            })

            // Get place name for notification
            const placeData = typeof place === 'object' ? place : await findPlaceByReference(req.payload, doc.place)
            const placeName = String(placeData?.name || 'Unknown place')
            const placeIdForLink = String(placeId)

            // Send approval notification to user
            await notificationService.notifyClaimApproved(
              typeof doc.user === 'string' ? doc.user : doc.user.id,
              placeName,
              placeIdForLink
            )

            // Update other pending claims for this place to rejected
            const otherPendingClaims = await req.payload.find({
              collection: 'requests',
              where: {
                and: [
                  { 'place.relationTo': { equals: placeCollection } },
                  { 'place.value': { equals: placeId } },
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
                  notes: 'Another claim was approved for this place',
                },
              })

              // Send rejection notification
              await notificationService.notifyClaimRejected(
                typeof claim.user === 'string' ? claim.user : claim.user.id,
                placeName,
                'Another claim was approved for this place'
              )
            }
          }

          // Handle rejected claims
          if (doc.status === 'rejected' && previousDoc.status !== 'rejected') {
            const placeData = await findPlaceByReference(req.payload, doc.place)
            const placeName = String(placeData?.name || 'Unknown place')

            // Send rejection notification to user
            await notificationService.notifyClaimRejected(
              typeof doc.user === 'string' ? doc.user : doc.user.id,
              placeName,
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



