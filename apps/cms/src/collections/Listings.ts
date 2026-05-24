import type { Access, AccessResult, CollectionConfig } from 'payload'

import {
  FARM_SUBTYPE_OPTIONS,
  LITTLE_SUBTYPE_OPTIONS,
  LISTING_TYPE_OPTIONS,
  WATERPOINT_SUBTYPE_OPTIONS,
  type ListingKindPayload,
  normalizeListingKindFields,
} from '../constants/listingTaxonomy'
import NotificationService from '../lib/notificationService'

export const Listings: CollectionConfig = {
  slug: 'listings',
  admin: {
    useAsTitle: 'name',
  },
  versions: {
    drafts: true,
  },
  access: {
    read: (({ req: { user } }): AccessResult => {
      if (!user) {
        return {
          and: [
            { publishStatus: { equals: 'live' } },
            { deletedAt: { exists: false } },
          ],
        } as AccessResult
      }

      if (user.role === 'admin') {
        return true
      }

      return {
        or: [
          {
            and: [
              { publishStatus: { equals: 'live' } },
              { deletedAt: { exists: false } },
            ],
          },
          {
            and: [
              { owner: { equals: user.id } },
              { publishStatus: { equals: 'draft' } },
              { deletedAt: { exists: false } },
            ],
          },
          {
            and: [{ owner: { equals: user.id } }, { deletedAt: { exists: true } }],
          },
        ],
      } as AccessResult
    }) as Access,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        owner: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Basic Info',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
            },
            {
              name: 'description',
              type: 'textarea',
              required: true,
            },
            {
              name: 'listingType',
              type: 'select',
              label: 'Listing type',
              options: [...LISTING_TYPE_OPTIONS],
              defaultValue: 'little',
              required: true,
            },
            {
              name: 'littleSubtype',
              type: 'select',
              label: 'Subtype (little listings)',
              options: [...LITTLE_SUBTYPE_OPTIONS],
              defaultValue: 'other',
              admin: {
                condition: (data) => data.listingType === 'little',
              },
            },
            {
              name: 'farmSubtype',
              type: 'select',
              label: 'Subtype (farm)',
              options: [...FARM_SUBTYPE_OPTIONS],
              admin: {
                condition: (data) => data.listingType === 'farm',
              },
            },
            {
              name: 'waterpointSubtype',
              type: 'select',
              label: 'Subtype (waterpoints)',
              options: [...WATERPOINT_SUBTYPE_OPTIONS],
              admin: {
                condition: (data) => data.listingType === 'waterpoint',
              },
            },
            {
              name: 'publishStatus',
              type: 'select',
              label: 'Publish Status',
              defaultValue: 'draft',
              options: [
                { label: 'Draft', value: 'draft' },
                { label: 'Live', value: 'live' },
              ],
              required: true,
              admin: {
                description: 'Whether this listing is visible to the public or still in draft mode',
              },
            },
            {
              name: 'deletedAt',
              type: 'date',
              admin: {
                description:
                  'Soft delete: set to hide from public map and search; clear to restore. Owners use the app or PATCH; hard remove is admin-only.',
                position: 'sidebar',
              },
            },
            {
              name: 'tags',
              type: 'array',
              fields: [
                {
                  name: 'tag',
                  type: 'text',
                },
              ],
            },
            {
              name: 'owner',
              type: 'relationship',
              relationTo: 'users',
              admin: {
                description: 'The user who owns this listing',
              },
            },
            {
              name: 'pendingOwner',
              type: 'relationship',
              relationTo: 'users',
              admin: {
                description: 'User who has submitted a claim for this listing',
              },
            },
          ],
        },
        {
          label: 'Location',
          fields: [
            {
              name: 'location',
              type: 'group',
              fields: [
                {
                  name: 'street',
                  type: 'text',
                  label: 'Street',
                },
                {
                  name: 'houseNumber',
                  type: 'text',
                  label: 'House Number',
                },
                {
                  name: 'zipCode',
                  type: 'text',
                  label: 'Zip Code',
                },
                {
                  name: 'city',
                  type: 'text',
                  label: 'City',
                },
                {
                  name: 'province',
                  type: 'text',
                  label: 'Province',
                },
                {
                  name: 'country',
                  type: 'text',
                  label: 'Country',
                  defaultValue: 'Netherlands',
                },
                {
                  name: 'address',
                  type: 'text',
                  label: 'Full Address (computed)',
                  admin: {
                    description: 'Full address string for display and geocoding',
                  },
                },
                {
                  name: 'coordinates',
                  type: 'point',
                  label: 'Coordinates',
                  index: true,
                },
                {
                  name: 'latitude',
                  type: 'number',
                  index: true,
                  admin: {
                    description: 'Canonical latitude for cross-database geo querying',
                  },
                },
                {
                  name: 'longitude',
                  type: 'number',
                  index: true,
                  admin: {
                    description: 'Canonical longitude for cross-database geo querying',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Facilities',
          fields: [
            {
              name: 'facilities',
              type: 'group',
              label: 'Facilities & Information',
              fields: [
                {
                  name: 'openingHours',
                  type: 'textarea',
                  label: 'Opening Hours',
                  admin: {
                    description:
                      'When is this location accessible? E.g., "Mon-Fri 9-17, Sat 10-16"',
                  },
                },
                {
                  name: 'facilities',
                  type: 'array',
                  label: 'Available Facilities',
                  fields: [
                    {
                      name: 'facility',
                      type: 'select',
                      options: [
                        { label: '24/7 Access', value: '24_7_access' },
                        { label: 'Wheelchair Accessible', value: 'wheelchair_accessible' },
                        { label: 'Parking Available', value: 'parking' },
                        { label: 'Indoor', value: 'indoor' },
                        { label: 'Outdoor', value: 'outdoor' },
                        { label: 'Sheltered', value: 'sheltered' },
                        { label: 'Lighting', value: 'lighting' },
                        { label: 'Security Camera', value: 'security_camera' },
                        { label: 'Contact Required', value: 'contact_required' },
                        { label: 'Free Access', value: 'free_access' },
                        { label: 'Membership Required', value: 'membership_required' },
                      ],
                    },
                  ],
                },
                {
                  name: 'rules',
                  type: 'textarea',
                  label: 'House Rules',
                  admin: {
                    description: 'Any special rules or guidelines for using this location',
                  },
                },
                {
                  name: 'contactInfo',
                  type: 'text',
                  label: 'Contact Information',
                  admin: {
                    description: 'How can people get in touch if they need help?',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Photos',
          fields: [
            {
              name: 'pictures',
              type: 'array',
              admin: {
                description: 'Photos for this listing',
              },
              fields: [
                {
                  name: 'photo',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
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
                {
                  name: 'status',
                  type: 'select',
                  defaultValue: 'pending',
                  options: [
                    { label: 'Pending', value: 'pending' },
                    { label: 'Approved', value: 'approved' },
                    { label: 'Rejected', value: 'rejected' },
                  ],
                  required: true,
                },
                {
                  name: 'approved_by',
                  type: 'relationship',
                  relationTo: 'users',
                },
                {
                  name: 'approved_at',
                  type: 'date',
                },
                {
                  name: 'rejection_reason',
                  type: 'textarea',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (!data) return data
        if (operation === 'create' && req.user?.role !== 'admin' && data.deletedAt) {
          data.deletedAt = null
        }
        if (data.deletedAt && data.publishStatus === 'live') {
          data.publishStatus = 'draft'
        }
        return data
      },
    ],
    beforeValidate: [
      ({ data, req, operation, originalDoc }) => {
        if (!data) return data

        if (operation === 'create' && req.user && !data.owner) {
          data.owner = req.user.id
        }

        const effective =
          operation === 'update' && originalDoc && typeof originalDoc === 'object'
            ? { ...(originalDoc as Record<string, unknown>), ...(data as Record<string, unknown>) }
            : { ...(data as Record<string, unknown>) }

        normalizeListingKindFields(effective as ListingKindPayload)

        const out = data as Record<string, unknown>
        out.listingType = effective.listingType
        out.littleSubtype = effective.littleSubtype
        out.farmSubtype = effective.farmSubtype
        out.waterpointSubtype = effective.waterpointSubtype
        delete out.category

        const coordinates = data.location?.coordinates
        if (Array.isArray(coordinates) && coordinates.length === 2) {
          data.location.longitude = coordinates[0]
          data.location.latitude = coordinates[1]
        } else if (
          typeof data.location?.longitude === 'number' &&
          typeof data.location?.latitude === 'number'
        ) {
          data.location.coordinates = [data.location.longitude, data.location.latitude]
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        try {
          const notificationService = new NotificationService(req.payload)

          if (operation === 'update' && previousDoc) {
            // Handle picture notifications
            const previousPictures = previousDoc.pictures || []
            const currentPictures = doc.pictures || []

            // Find newly added pictures
            const addedPictures = currentPictures.filter((currentPic: { id?: string | number }) => {
              return !previousPictures.some(
                (prevPic: { id?: string | number }) => prevPic.id === currentPic.id,
              )
            })

            // Find status changes in existing pictures
            const statusChangedPictures = currentPictures.filter(
              (currentPic: { id?: string | number; status?: string }) => {
                const previousPic = previousPictures.find(
                  (prev: { id?: string | number; status?: string }) => prev.id === currentPic.id,
                )
                return (
                  previousPic &&
                  previousPic.status !== currentPic.status &&
                  currentPic.status !== 'pending'
                )
              },
            )

            // Send notifications for new picture requests
            for (const picture of addedPictures) {
              if (doc.owner && picture.created_by && typeof picture.created_by === 'object') {
                const requester = picture.created_by as any
                const requesterName = requester.name || requester.email || 'Iemand'
                const listingOwnerId = typeof doc.owner === 'string' ? doc.owner : doc.owner?.id

                if (listingOwnerId && listingOwnerId !== requester.id) {
                  await notificationService.notifyPhotoRequest(
                    listingOwnerId,
                    requesterName,
                    doc.name || 'Listing',
                  )
                }
              }
            }

            // Send notifications for status changes
            for (const picture of statusChangedPictures) {
              if (picture.created_by && typeof picture.created_by === 'object') {
                const requester = picture.created_by as any
                const requesterId = typeof requester === 'string' ? requester : requester.id

                if (picture.status === 'approved') {
                  await notificationService.notifyPhotoStatus(
                    requesterId,
                    doc.name || 'Listing',
                    'approved',
                  )
                } else if (picture.status === 'rejected') {
                  await notificationService.notifyPhotoStatus(
                    requesterId,
                    doc.name || 'Listing',
                    'rejected',
                    picture.rejection_reason,
                  )
                }
              }
            }
          }
        } catch (error) {
          console.error('Failed to send picture notification:', error)
          // Don't throw error to prevent the operation from failing
        }

        return doc
      },
    ],
  },
}
