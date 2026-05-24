import type { CollectionConfig } from 'payload'
import NotificationService from '../lib/notificationService'
import { generateMail } from '../globals/Mail/utilities/sendMail'
import { config } from '../config/config'
import { MAP_PLACE_RELATION_TO } from '../constants/mapPlaces'
import { findPlaceByReference, getPlaceCollection, getPlaceId } from '../lib/mapPlaces'
import { assertPlaceInteractionAllowed } from '../lib/placeInteractionScope'
import { emailLookupCollectionEndpoint } from '../endpoints/emailLookup'
import { resendVerificationCodeEndpoint } from '../endpoints/resendVerificationCode'
import { verifyEmailCodeEndpoint } from '../endpoints/verifyEmailCode'
import { issueSignupOtpAndBuildVerificationEmail } from '../lib/signupVerificationEmailHtml'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  endpoints: [emailLookupCollectionEndpoint, verifyEmailCodeEndpoint, resendVerificationCodeEndpoint],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        if (!data) {
          return data
        }

        const coordinates = data.address?.coordinates
        if (Array.isArray(coordinates) && coordinates.length === 2) {
          data.address.latitude = coordinates[1]
          data.address.longitude = coordinates[0]
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

        const previousFavorites = Array.isArray(originalDoc?.favorites) ? originalDoc.favorites : []
        const currentFavorites = Array.isArray(data.favorites) ? data.favorites : previousFavorites
        const favoriteCandidates =
          operation === 'create'
            ? currentFavorites
            : currentFavorites.filter((currentFav: any) => {
                const currentPlaceKey = `${getPlaceCollection(currentFav.place)}:${getPlaceId(currentFav.place)}`
                return !previousFavorites.some((prevFav: any) => {
                  const prevPlaceKey = `${getPlaceCollection(prevFav.place)}:${getPlaceId(prevFav.place)}`
                  return prevPlaceKey === currentPlaceKey
                })
              })

        for (const favorite of favoriteCandidates) {
          if (favorite?.place) {
            await assertPlaceInteractionAllowed(req, favorite.place, 'favorite')
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
              const currentPlaceKey = `${getPlaceCollection(currentFav.place)}:${getPlaceId(currentFav.place)}`
              return !previousFavorites.some((prevFav: any) => {
                const prevPlaceKey = `${getPlaceCollection(prevFav.place)}:${getPlaceId(prevFav.place)}`
                return prevPlaceKey === currentPlaceKey
              })
            })

            // Send notifications for new favorites
            for (const favorite of addedFavorites) {
              if (favorite.place) {
                const place = await findPlaceByReference(req.payload, favorite.place)
                const listingOwnerId =
                  typeof place.owner === 'string' || typeof place.owner === 'number'
                    ? String(place.owner)
                    : place.owner && typeof place.owner === 'object' && 'id' in place.owner
                      ? String((place.owner as { id: string | number }).id)
                      : null

                if (listingOwnerId && listingOwnerId !== doc.id) {
                  // Don't notify if user favorites their own listing
                  const favoriterName = doc.name || doc.email || 'Iemand'

                  await notificationService.notifyFavorite(
                    listingOwnerId,
                    favoriterName,
                    String(place.name || 'Place'),
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
        return issueSignupOtpAndBuildVerificationEmail({
          req,
          token,
          user,
        })
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
      name: 'signupOtpHash',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'signupOtpExpiresAt',
      type: 'date',
      admin: {
        hidden: true,
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
        {
          name: 'latitude',
          type: 'number',
          admin: {
            description: 'Canonical latitude derived from coordinates',
            readOnly: true,
          },
        },
        {
          name: 'longitude',
          type: 'number',
          admin: {
            description: 'Canonical longitude derived from coordinates',
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'favorites',
      type: 'array',
      admin: {
        description: "User's favorite places",
      },
      fields: [
        {
          name: 'place',
          type: 'relationship',
          relationTo: MAP_PLACE_RELATION_TO,
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
    {
      name: 'homeArea',
      type: 'group',
      admin: {
        description: 'Default home search area for entitlement checks',
        position: 'sidebar',
      },
      fields: [
        {
          name: 'city',
          type: 'text',
        },
        {
          name: 'province',
          type: 'text',
        },
        {
          name: 'country',
          type: 'text',
          defaultValue: 'Netherlands',
        },
        {
          name: 'radiusMeters',
          type: 'number',
          defaultValue: 15000,
        },
      ],
    },
  ],
}
