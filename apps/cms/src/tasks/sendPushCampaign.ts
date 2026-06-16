import type { Payload, TaskConfig } from 'payload'

import { dispatchNotification } from '../lib/notifications/dispatchNotification'
import type { DispatchNotificationResult } from '../lib/notifications/notificationTypes'
import { USERS_PAGE_SIZE } from '../lib/notifications/notificationTypes'

type CampaignDoc = {
  id: string | number
  title: string
  message: string
  actionUrl?: string | null
  audience: 'single_user' | 'all_users'
  targetUser?: string | number | { id: string | number } | null
}

function readUserId(value: CampaignDoc['targetUser']): string | number | null {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'object' && 'id' in value) {
    return value.id
  }
  return value
}

function mergeDispatchResult(
  totals: DispatchNotificationResult,
  row: DispatchNotificationResult,
): DispatchNotificationResult {
  return {
    inboxCreated: totals.inboxCreated + (row.inboxCreated ? 1 : 0),
    pushAttempted: totals.pushAttempted + (row.pushAttempted ? 1 : 0),
    pushSent: totals.pushSent + (row.pushSent ? 1 : 0),
    pushFailed: totals.pushFailed + (row.pushFailed ? 1 : 0),
    skippedNoToken: totals.skippedNoToken + (row.skippedNoToken ? 1 : 0),
    skippedPreference: totals.skippedPreference + (row.skippedPreference ? 1 : 0),
  }
}

async function resolveRecipientIds(
  campaign: CampaignDoc,
  payload: Payload,
): Promise<Array<string | number>> {
  if (campaign.audience === 'single_user') {
    const userId = readUserId(campaign.targetUser)
    if (!userId) {
      throw new Error('Target user is required for single-user campaigns')
    }
    return [userId]
  }

  const ids: Array<string | number> = []
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const result = await payload.find({
      collection: 'users',
      depth: 0,
      limit: USERS_PAGE_SIZE,
      page,
      where: {
        isAnonymous: {
          equals: false,
        },
      },
    })

    for (const doc of result.docs) {
      ids.push(doc.id)
    }

    hasNextPage = result.hasNextPage
    page += 1
  }

  return ids
}

export const sendPushCampaign: TaskConfig = {
  slug: 'sendPushCampaign',
  handler: async (args) => {
    const { req } = args
    const { payload } = req
    const rawCampaignId =
      args.input && typeof args.input === 'object'
        ? (args.input as Record<string, unknown>).campaignId
        : undefined

    if (rawCampaignId === undefined || rawCampaignId === null || rawCampaignId === '') {
      return {
        state: 'failed' as const,
        errorMessage: 'sendPushCampaign: campaignId is required',
      }
    }

    try {
      const campaign = (await payload.findByID({
        collection: 'push-campaigns',
        id: rawCampaignId,
        depth: 0,
      })) as CampaignDoc | null

      if (!campaign) {
        return {
          state: 'failed' as const,
          errorMessage: `sendPushCampaign: campaign ${rawCampaignId} not found`,
        }
      }

      await payload.update({
        collection: 'push-campaigns',
        id: campaign.id,
        data: {
          status: 'sending',
        },
      })

      const recipientIds = await resolveRecipientIds(campaign, payload)

      let totals: DispatchNotificationResult = {
        inboxCreated: 0,
        pushAttempted: 0,
        pushSent: 0,
        pushFailed: 0,
        skippedNoToken: 0,
        skippedPreference: 0,
      }

      for (const recipientId of recipientIds) {
        const row = await dispatchNotification(payload, {
          recipientId,
          type: 'system',
          title: campaign.title,
          message: campaign.message,
          actionUrl: campaign.actionUrl ?? undefined,
          source: 'campaign',
          campaignId: campaign.id,
        })
        totals = mergeDispatchResult(totals, row)
      }

      await payload.update({
        collection: 'push-campaigns',
        id: campaign.id,
        data: {
          status: 'completed',
          targetCount: recipientIds.length,
          inboxCreated: totals.inboxCreated,
          pushAttempted: totals.pushAttempted,
          pushSent: totals.pushSent,
          pushFailed: totals.pushFailed,
          skippedNoToken: totals.skippedNoToken,
          skippedPreference: totals.skippedPreference,
        },
      })

      return {
        output: {
          campaignId: campaign.id,
          targetCount: recipientIds.length,
          ...totals,
        },
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      await payload.update({
        collection: 'push-campaigns',
        id: rawCampaignId,
        data: {
          status: 'failed',
          lastError: errorMessage,
        },
      })

      return {
        state: 'failed' as const,
        errorMessage,
      }
    }
  },
}
