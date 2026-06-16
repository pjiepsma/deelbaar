import { APIError, type CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'
import { sendPushCampaignEndpoint } from '../endpoints/sendPushCampaign'

const CAMPAIGN_LOCKED_STATUSES = ['queued', 'sending', 'completed', 'failed'] as const

const COMPOSE_FIELD_NAMES = ['title', 'message', 'audience', 'targetUser', 'actionUrl'] as const

type ComposeFieldName = (typeof COMPOSE_FIELD_NAMES)[number]

function relationshipId(value: unknown): string | number | null {
  if (value == null) {
    return null
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return value
  }
  if (typeof value === 'object' && 'id' in value && value.id != null) {
    return value.id as string | number
  }
  return null
}

function composeFieldChanged(
  field: ComposeFieldName,
  next: Record<string, unknown>,
  prior: Record<string, unknown>,
): boolean {
  if (field === 'targetUser') {
    return relationshipId(next[field]) !== relationshipId(prior[field])
  }
  return next[field] !== prior[field]
}

function assertComposeFieldsEditable(
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown>,
): void {
  for (const field of COMPOSE_FIELD_NAMES) {
    if (!(field in data)) {
      continue
    }
    if (composeFieldChanged(field, data, originalDoc)) {
      throw new APIError('Campaign compose fields cannot be edited after send.', 400)
    }
  }
}

export const PushCampaigns: CollectionConfig = {
  slug: 'push-campaigns',
  admin: {
    useAsTitle: 'title',
    group: 'Admin',
    defaultColumns: ['title', 'audience', 'status', 'targetCount', 'pushSent', 'sentAt'],
    description: 'Compose and send push announcements to app users. Save as draft, then Send campaign.',
    components: {
      edit: {
        beforeDocumentControls: ['src/components/SendPushCampaignButton#SendPushCampaignButton'],
      },
    },
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  endpoints: [sendPushCampaignEndpoint],
  hooks: {
    beforeChange: [
      ({ data, originalDoc, operation }) => {
        if (operation !== 'update' || !originalDoc || !data) {
          return data
        }

        const priorStatus = originalDoc.status
        if (!priorStatus || priorStatus === 'draft') {
          return data
        }

        assertComposeFieldsEditable(
          data as Record<string, unknown>,
          originalDoc as Record<string, unknown>,
        )

        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'audience',
      type: 'select',
      required: true,
      defaultValue: 'single_user',
      options: [
        { label: 'Single user', value: 'single_user' },
        { label: 'All users', value: 'all_users' },
      ],
    },
    {
      name: 'targetUser',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        condition: (data) => data?.audience === 'single_user',
        description: 'Required when audience is Single user.',
      },
    },
    {
      name: 'actionUrl',
      type: 'text',
      admin: {
        description: 'Optional deep link (e.g. deelbaar://listing/kiosks/123)',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Queued', value: 'queued' },
        { label: 'Sending', value: 'sending' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
      ],
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'sentBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'sentAt',
      type: 'date',
      admin: {
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'targetCount',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true },
        },
        {
          name: 'inboxCreated',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true },
        },
        {
          name: 'pushAttempted',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'pushSent',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true },
        },
        {
          name: 'pushFailed',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true },
        },
        {
          name: 'skippedNoToken',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: 'skippedPreference',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
    {
      name: 'lastError',
      type: 'textarea',
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
}
