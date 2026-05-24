import type { Access, AccessResult, CollectionConfig, Field } from 'payload'
import NotificationService from '../../lib/notificationService'
import type { MapPlaceCollectionSlug } from '../../constants/mapPlaces'

const FACILITY_OPTIONS = [
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
] as const

type BuildMapPlaceCollectionArgs = {
  slug: MapPlaceCollectionSlug
  placeLabel: string
  subtypeFieldName: string
  subtypeFieldLabel: string
  subtypeOptions: readonly { label: string; value: string }[]
  ownerManaged: boolean
  allowPhotos: boolean
}

function baseReadAccess({ req: { user } }: { req: { user?: { id: string; role?: string } } }): AccessResult {
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
}

function buildLocationField(): Field {
  return {
    name: 'location',
    type: 'group',
    fields: [
      { name: 'street', type: 'text', label: 'Street' },
      { name: 'houseNumber', type: 'text', label: 'House Number' },
      { name: 'zipCode', type: 'text', label: 'Zip Code' },
      { name: 'city', type: 'text', label: 'City' },
      { name: 'province', type: 'text', label: 'Province' },
      { name: 'country', type: 'text', label: 'Country', defaultValue: 'Netherlands' },
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
  }
}

function buildFacilitiesField(): Field {
  return {
    name: 'facilities',
    type: 'group',
    label: 'Facilities & Information',
    fields: [
      {
        name: 'openingHours',
        type: 'textarea',
        label: 'Opening Hours',
      },
      {
        name: 'facilities',
        type: 'array',
        label: 'Available Facilities',
        fields: [
          {
            name: 'facility',
            type: 'select',
            options: [...FACILITY_OPTIONS],
          },
        ],
      },
      {
        name: 'rules',
        type: 'textarea',
        label: 'House Rules',
      },
      {
        name: 'contactInfo',
        type: 'text',
        label: 'Contact Information',
      },
    ],
  }
}

export function buildMapPlaceCollection({
  slug,
  placeLabel,
  subtypeFieldName,
  subtypeFieldLabel,
  subtypeOptions,
  ownerManaged,
  allowPhotos,
}: BuildMapPlaceCollectionArgs): CollectionConfig {
  const basicFields: Field[] = [
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: true },
    {
      name: subtypeFieldName,
      type: 'select',
      label: subtypeFieldLabel,
      required: true,
      options: [...subtypeOptions],
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
      fields: [{ name: 'tag', type: 'text' }],
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: `Owner account for this ${placeLabel.toLowerCase()}`,
      },
    },
    {
      name: 'pendingOwner',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who has submitted a claim for this place',
      },
    },
  ]

  const tabs: { label: string; fields: Field[] }[] = [
    { label: 'Basic Info', fields: basicFields },
    { label: 'Location', fields: [buildLocationField()] },
    { label: 'Facilities', fields: [buildFacilitiesField()] },
  ]

  if (allowPhotos) {
    tabs.push({
      label: 'Photos',
      fields: [
        {
          name: 'pictures',
          type: 'array',
          fields: [
            { name: 'photo', type: 'upload', relationTo: 'media', required: true },
            {
              name: 'created_by',
              type: 'relationship',
              relationTo: 'users',
              required: true,
              admin: { readOnly: true },
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
            { name: 'approved_by', type: 'relationship', relationTo: 'users' },
            { name: 'approved_at', type: 'date' },
            { name: 'rejection_reason', type: 'textarea' },
          ],
        },
      ],
    })
  }

  return {
    slug,
    admin: {
      useAsTitle: 'name',
    },
    versions: {
      drafts: true,
    },
    access: {
      read: baseReadAccess as Access,
      create: ({ req: { user } }) => {
        if (!user) return false
        if (ownerManaged) return true
        return user.role === 'admin'
      },
      update: ({ req: { user } }) => {
        if (!user) return false
        if (user.role === 'admin') return true
        if (!ownerManaged) return false
        return { owner: { equals: user.id } }
      },
      delete: ({ req: { user } }) => user?.role === 'admin',
    },
    fields: [
      {
        type: 'tabs',
        tabs,
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
        ({ data, req, operation }) => {
          if (!data) return data
          if (ownerManaged && operation === 'create' && req.user && !data.owner) {
            data.owner = req.user.id
          }
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
      afterChange: allowPhotos
        ? [
            async ({ doc, req, operation, previousDoc }) => {
              try {
                const notificationService = new NotificationService(req.payload)
                if (operation !== 'update' || !previousDoc) return doc
                const previousPictures = previousDoc.pictures || []
                const currentPictures = doc.pictures || []
                const addedPictures = currentPictures.filter((currentPic: { id?: string | number }) => {
                  return !previousPictures.some(
                    (prevPic: { id?: string | number }) => prevPic.id === currentPic.id,
                  )
                })
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

                for (const picture of addedPictures) {
                  if (doc.owner && picture.created_by && typeof picture.created_by === 'object') {
                    const requester = picture.created_by as { id: string; name?: string; email?: string }
                    const requesterName = requester.name || requester.email || 'Iemand'
                    const placeOwnerId = typeof doc.owner === 'string' ? doc.owner : doc.owner?.id
                    if (placeOwnerId && placeOwnerId !== requester.id) {
                      await notificationService.notifyPhotoRequest(
                        placeOwnerId,
                        requesterName,
                        doc.name || placeLabel,
                      )
                    }
                  }
                }

                for (const picture of statusChangedPictures) {
                  if (picture.created_by && typeof picture.created_by === 'object') {
                    const requester = picture.created_by as { id: string }
                    const requesterId = requester.id
                    if (picture.status === 'approved') {
                      await notificationService.notifyPhotoStatus(
                        requesterId,
                        doc.name || placeLabel,
                        'approved',
                      )
                    } else if (picture.status === 'rejected') {
                      await notificationService.notifyPhotoStatus(
                        requesterId,
                        doc.name || placeLabel,
                        'rejected',
                        undefined,
                        picture.rejection_reason,
                      )
                    }
                  }
                }
              } catch (error) {
                console.error('Failed to send picture notification:', error)
              }
              return doc
            },
          ]
        : [],
    },
  }
}
