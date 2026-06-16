import { addDataAndFileToRequest, type Endpoint } from 'payload'

import { PUSH_CAMPAIGN_QUEUE } from '../lib/notifications/notificationTypes'

type SendBody = {
  id?: string | number
  campaignId?: string | number
}

const json = (body: object, init?: ResponseInit): Response => {
  const headers = new Headers(init?.headers)
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  return new Response(JSON.stringify(body), { ...init, headers })
}

async function readBodyFromWebRequest(req: unknown): Promise<SendBody | null> {
  const asRequest = req as { text?: () => Promise<string> }
  if (typeof asRequest.text !== 'function') {
    return null
  }
  try {
    const raw = await asRequest.text()
    if (typeof raw !== 'string' || raw.length === 0) {
      return null
    }
    return JSON.parse(raw) as SendBody
  } catch {
    return null
  }
}

async function parseBody(req: {
  body?: unknown
  data?: unknown
  json?: () => Promise<unknown>
}): Promise<SendBody | null> {
  const candidates: unknown[] = [req.body, req.data]

  if (typeof req.json === 'function') {
    try {
      candidates.push(await req.json())
    } catch {
      /* ignore */
    }
  }

  for (const candidate of candidates) {
    if (!candidate) {
      continue
    }

    if (typeof candidate === 'string') {
      try {
        return JSON.parse(candidate) as SendBody
      } catch {
        continue
      }
    }

    if (typeof candidate === 'object') {
      return candidate as SendBody
    }
  }

  return null
}

function readCampaignId(routeId: unknown, body: SendBody | null): string | number | null {
  const fromRoute = routeId
  if (fromRoute !== undefined && fromRoute !== null && fromRoute !== '') {
    return fromRoute as string | number
  }

  const fromBody = body?.id ?? body?.campaignId
  if (fromBody !== undefined && fromBody !== null && fromBody !== '') {
    return fromBody
  }

  return null
}

export const sendPushCampaignEndpoint: Endpoint = {
  path: '/:id/send',
  method: 'post',
  handler: async (req) => {
    if (!req.user || req.user.role !== 'admin') {
      return json({ message: 'Unauthorized' }, { status: 403 })
    }

    await addDataAndFileToRequest(req)

    const body =
      (await readBodyFromWebRequest(req)) ??
      (await parseBody(req as { body?: unknown; data?: unknown; json?: () => Promise<unknown> })) ??
      (req.data && typeof req.data === 'object' ? (req.data as SendBody) : null)

    const campaignId = readCampaignId(req.routeParams?.id, body)
    if (campaignId === null) {
      return json({ message: 'Campaign id is required' }, { status: 400 })
    }

    const campaign = await req.payload.findByID({
      collection: 'push-campaigns',
      id: campaignId,
      depth: 0,
    })

    if (!campaign) {
      return json({ message: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status !== 'draft') {
      return json({ message: 'Only draft campaigns can be sent' }, { status: 400 })
    }

    if (campaign.audience === 'single_user' && !campaign.targetUser) {
      return json({ message: 'Target user is required for single-user campaigns' }, { status: 400 })
    }

    await req.payload.update({
      collection: 'push-campaigns',
      id: campaignId,
      data: {
        status: 'queued',
        sentBy: req.user.id,
        sentAt: new Date().toISOString(),
      },
    })

    await req.payload.jobs.queue({
      task: 'sendPushCampaign',
      queue: PUSH_CAMPAIGN_QUEUE,
      input: {
        campaignId,
      },
    })

    return json({
      queued: true,
      campaignId,
      message: 'Campaign queued for delivery',
    })
  },
}
