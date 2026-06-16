import { beforeEach, describe, expect, it, vi } from 'vitest'

import NotificationService from '@/lib/notificationService'
import { sendFcmToToken } from '@/lib/push/fcmClient'

vi.mock('@/lib/push/fcmClient', () => ({
  sendFcmToToken: vi.fn(),
}))

const mockSendFcmToToken = vi.mocked(sendFcmToToken)

describe('NotificationService FCM push', () => {
  const mockPayload = {
    findByID: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPayload.create.mockImplementation(async ({ collection }) => ({
      id: collection === 'notifications' ? 'notif-1' : 'delivery-1',
    }))
  })

  it('sends via FCM when pushPlatform is android', async () => {
    mockSendFcmToToken.mockResolvedValue({ ok: true })
    mockPayload.findByID.mockResolvedValue({
      id: 'user-1',
      pushToken: 'fcm-token-abc',
      pushPlatform: 'android',
      notificationSettings: {},
    })

    const service = new NotificationService(mockPayload as never)
    const sent = await service.sendToUser('user-1', {
      title: 'Test',
      body: 'Body',
    })

    expect(mockSendFcmToToken).toHaveBeenCalledWith(
      'fcm-token-abc',
      expect.objectContaining({
        title: 'Test',
        body: 'Body',
      }),
    )
    expect(sent).toBe(true)
  })

  it('skips FCM when pushPlatform is ios', async () => {
    mockPayload.findByID.mockResolvedValue({
      id: 'user-1',
      pushToken: 'apns-token',
      pushPlatform: 'ios',
      notificationSettings: {},
    })

    const service = new NotificationService(mockPayload as never)
    const sent = await service.sendToUser('user-1', {
      title: 'Test',
      body: 'Body',
    })

    expect(mockSendFcmToToken).not.toHaveBeenCalled()
    expect(sent).toBe(false)
  })

  it('clears stale push token when FCM reports not registered', async () => {
    mockSendFcmToToken.mockResolvedValue({
      ok: false,
      reason: 'token-not-registered',
      clearToken: true,
    })
    mockPayload.findByID.mockResolvedValue({
      id: 'user-1',
      pushToken: 'stale-token',
      pushPlatform: 'android',
      notificationSettings: {},
    })

    const service = new NotificationService(mockPayload as never)
    await service.sendToUser('user-1', {
      title: 'Test',
      body: 'Body',
    })

    expect(mockPayload.update).toHaveBeenCalledWith({
      collection: 'users',
      id: 'user-1',
      overrideAccess: true,
      data: {
        pushToken: null,
        pushPlatform: null,
        pushTokenUpdatedAt: null,
      },
    })
  })

  it('does not reference Expo push API', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const source = readFileSync(resolve(process.cwd(), 'src/lib/notificationService.ts'), 'utf8')
    expect(source).not.toContain('exp.host')
  })
})
