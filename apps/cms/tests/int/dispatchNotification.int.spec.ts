import { beforeEach, describe, expect, it, vi } from 'vitest'

import { dispatchNotification } from '@/lib/notifications/dispatchNotification'
import { sendFcmToToken } from '@/lib/push/fcmClient'

vi.mock('@/lib/push/fcmClient', () => ({
  sendFcmToToken: vi.fn(),
}))

const mockSendFcmToToken = vi.mocked(sendFcmToToken)

describe('dispatchNotification', () => {
  const mockPayload = {
    findByID: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPayload.create.mockImplementation(async ({ collection }) => ({
      id: collection === 'notifications' ? 'inbox-1' : 'delivery-1',
    }))
  })

  it('creates inbox and two delivery rows when FCM succeeds', async () => {
    mockSendFcmToToken.mockResolvedValue({ ok: true })
    mockPayload.findByID.mockResolvedValue({
      id: 'user-1',
      pushToken: 'fcm-token',
      pushPlatform: 'android',
      notificationSettings: {},
    })

    const result = await dispatchNotification(mockPayload as never, {
      recipientId: 'user-1',
      type: 'review',
      title: 'Title',
      message: 'Body',
      source: 'event',
    })

    expect(result.inboxCreated).toBe(true)
    expect(result.pushSent).toBe(true)
    expect(mockPayload.create).toHaveBeenCalledTimes(3)
    expect(mockSendFcmToToken).toHaveBeenCalled()
  })

  it('skips inbox when preference disabled and logs skipped delivery', async () => {
    mockPayload.findByID.mockResolvedValue({
      id: 'user-1',
      pushToken: 'fcm-token',
      pushPlatform: 'android',
      notificationSettings: { reviews: false },
    })

    const result = await dispatchNotification(mockPayload as never, {
      recipientId: 'user-1',
      type: 'review',
      title: 'Title',
      message: 'Body',
      source: 'event',
    })

    expect(result.skippedPreference).toBe(true)
    expect(result.inboxCreated).toBe(false)
    expect(mockSendFcmToToken).not.toHaveBeenCalled()
    expect(mockPayload.create).toHaveBeenCalledTimes(1)
  })
})
