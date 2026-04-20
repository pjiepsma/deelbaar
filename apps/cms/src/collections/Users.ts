import type { CollectionConfig } from 'payload'
import NotificationService from '../lib/notificationService'
import { generateMail } from '../globals/Mail/utilities/sendMail'
import { config } from '../config/config'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        if (!data) {
          return data
        }

        if (typeof data.pushToken === 'string') {
          const trimmed = data.pushToken.trim()
          data.pushToken = trimmed.length > 0 ? trimmed : null
        }

        if (data.pushToken !== undefined) {
          const previousToken = originalDoc?.pushToken
          const incomingToken = data.pushToken

          if (incomingToken !== previousToken) {
            data.pushTokenUpdatedAt = incomingToken ? new Date().toISOString() : null
          }
        }

        return data
      },
    ],
    beforeLogin: [
      ({ user }) => {
        // Block login for unverified users (unless admin)
        if (!user._verified && user.role !== 'admin') {
          throw new Error('Email not verified. Please verify your email before logging in.')
        }
        // Allow login by returning nothing (undefined)
      },
    ],
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        try {
          // Handle favorite notifications
          if (operation === 'update' && previousDoc) {
            const notificationService = new NotificationService(req.payload)

            // Check if favorites were added
            const previousFavorites = previousDoc.favorites || []
            const currentFavorites = doc.favorites || []

            // Find newly added favorites
            const addedFavorites = currentFavorites.filter((currentFav: any) => {
              const listingId =
                typeof currentFav.listing === 'string' ? currentFav.listing : currentFav.listing?.id
              return !previousFavorites.some((prevFav: any) => {
                const prevListingId =
                  typeof prevFav.listing === 'string' ? prevFav.listing : prevFav.listing?.id
                return prevListingId === listingId
              })
            })

            // Send notifications for new favorites
            for (const favorite of addedFavorites) {
              if (favorite.listing && typeof favorite.listing === 'object') {
                const listing = favorite.listing as any
                const listingOwnerId =
                  typeof listing.owner === 'string' ? listing.owner : listing.owner?.id

                if (listingOwnerId && listingOwnerId !== doc.id) {
                  // Don't notify if user favorites their own listing
                  const favoriterName = doc.name || doc.email || 'Iemand'

                  await notificationService.notifyFavorite(
                    listingOwnerId,
                    favoriterName,
                    listing.name || 'Listing',
                  )
                }
              }
            }
          }
        } catch (error) {
          console.error('Failed to send favorite notification:', error)
          // Don't throw error to prevent the operation from failing
        }

        return doc
      },
    ],
  },
  auth: {
    tokenExpiration: 7200, // 2 hours
    verify: {
      generateEmailHTML: async ({ req, token, user }) => {
        const { body } = await generateMail({
          type: 'verify',
          placeholders: {
            userName:
              user.name || user.surname ? `${user.name} ${user.surname}`.trim() : user.email,
            verificationUrl: `${process.env.PAYLOAD_PUBLIC_SERVER_URL || config.publicServerUrl}/verify?token=${token}`,
          },
          req,
        })

        return body
      },
      generateEmailSubject: async ({ req, token, user }) => {
        const { subject } = await generateMail({
          type: 'verify',
          placeholders: {
            userName:
              user.name || user.surname ? `${user.name} ${user.surname}`.trim() : user.email,
            verificationUrl: `${process.env.PAYLOAD_PUBLIC_SERVER_URL || config.publicServerUrl}/verify?token=${token}`,
          },
          req,
        })

        return subject
      },
    },
    forgotPassword: {
      generateEmailHTML: async (args) => {
        if (!args || !args.req || !args.token || !args.user) {
          return ''
        }

        const { body } = await generateMail({
          type: 'forgotPassword',
          placeholders: {
            userName:
              args.user.name || args.user.surname
                ? `${args.user.name} ${args.user.surname}`.trim()
                : args.user.email,
            resetUrl: `${process.env.PAYLOAD_PUBLIC_SERVER_URL || config.publicServerUrl}/reset-password?token=${args.token}`,
          },
          req: args.req,
        })

        return body
      },
      generateEmailSubject: async (args) => {
        if (!args || !args.req || !args.token || !args.user) {
          return ''
        }

        const { subject } = await generateMail({
          type: 'forgotPassword',
          placeholders: {
            userName:
              args.user.name || args.user.surname
                ? `${args.user.name} ${args.user.surname}`.trim()
                : args.user.email,
            resetUrl: `${process.env.PAYLOAD_PUBLIC_SERVER_URL || config.publicServerUrl}/reset-password?token=${args.token}`,
          },
          req: args.req,
        })

        return subject
      },
    },
    maxLoginAttempts: 5,
    lockTime: 600 * 1000, // 10 minutes
  },
  fields: [
    {
      name: 'isAnonymous',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this is an anonymous user account',
      },
    },
    {
      name: 'username',
      type: 'text',
      unique: true,
      admin: {
        description: 'Unique username for the user',
      },
    },
    {
      name: 'name',
      type: 'text',
      admin: {
        description: 'First name',
      },
    },
    {
      name: 'surname',
      type: 'text',
      admin: {
        description: 'Last name',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Profile picture',
      },
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Admin', value: 'admin' },
      ],
      defaultValue: 'user',
      required: true,
      admin: {
        description: 'User role',
      },
    },
    {
      name: 'googleSub',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Google account subject identifier',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'pushToken',
      type: 'text',
      admin: {
        description: 'Expo push token voor dit account',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'pushTokenUpdatedAt',
      type: 'date',
      admin: {
        description: 'Laatst bijgewerkte push token',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'address',
      type: 'group',
      admin: {
        description: 'User address information for claim validation',
      },
      fields: [
        {
          name: 'street',
          type: 'text',
          admin: {
            description: 'Street name',
          },
        },
        {
          name: 'houseNumber',
          type: 'text',
          admin: {
            description: 'House number',
          },
        },
        {
          name: 'postalCode',
          type: 'text',
          admin: {
            description: 'Postal code',
          },
        },
        {
          name: 'city',
          type: 'text',
          admin: {
            description: 'City',
          },
        },
        {
          name: 'coordinates',
          type: 'point',
          label: 'Location',
          admin: {
            description: 'Geographic coordinates (optional)',
          },
        },
      ],
    },
    {
      name: 'favorites',
      type: 'array',
      admin: {
        description: "User's favorite listings",
      },
      fields: [
        {
          name: 'listing',
          type: 'relationship',
          relationTo: 'listings',
          required: true,
        },
      ],
    },
    {
      name: 'notificationSettings',
      type: 'group',
      admin: {
        description: 'Voorkeuren voor push notificaties',
        position: 'sidebar',
      },
      fields: [
        {
          name: 'photoRequests',
          type: 'checkbox',
          label: 'Foto aanvragen',
          defaultValue: true,
        },
        {
          name: 'statusUpdates',
          type: 'checkbox',
          label: "Statusupdates voor foto's",
          defaultValue: true,
        },
        {
          name: 'reviews',
          type: 'checkbox',
          label: 'Nieuwe reviews',
          defaultValue: true,
        },
        {
          name: 'favorites',
          type: 'checkbox',
          label: 'Nieuwe favorieten',
          defaultValue: true,
        },
      ],
    },
    {
      name: 'searchAccess',
      type: 'group',
      admin: {
        description: 'One-time unlocked search scopes for listings',
        position: 'sidebar',
      },
      fields: [
        {
          name: 'province',
          type: 'checkbox',
          label: 'Province unlocked',
          defaultValue: false,
        },
        {
          name: 'country',
          type: 'checkbox',
          label: 'Country unlocked',
          defaultValue: false,
        },
        {
          name: 'world',
          type: 'checkbox',
          label: 'World unlocked',
          defaultValue: false,
        },
      ],
    },
  ],
}
