import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import admin from 'firebase-admin'

import { config } from '../../config/config'

export type FcmSendResult =
  | { ok: true }
  | { ok: false; reason: 'not-configured' | 'send-failed' }
  | { ok: false; reason: 'token-not-registered'; clearToken: true }

export type FcmNotificationPayload = {
  title: string
  body: string
  data?: Record<string, string>
}

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function validateServiceAccountJson(parsed: unknown): admin.ServiceAccount | null {
  if (parsed === null || typeof parsed !== 'object') {
    return null
  }

  const type = Reflect.get(parsed, 'type')
  const projectId = readNonEmptyString(Reflect.get(parsed, 'project_id'))
  const privateKey = readNonEmptyString(Reflect.get(parsed, 'private_key'))
  const clientEmail = readNonEmptyString(Reflect.get(parsed, 'client_email'))

  if (type !== 'service_account' || !projectId || !privateKey || !clientEmail) {
    return null
  }

  return {
    projectId,
    privateKey,
    clientEmail,
  }
}

let firebaseInitialized = false

function ensureFirebaseApp(): void {
  if (firebaseInitialized || admin.apps.length > 0) {
    firebaseInitialized = true
    return
  }

  const serviceAccountPath = config.firebaseServiceAccountPath
  if (!serviceAccountPath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH is not configured.')
  }

  const absolutePath = resolve(process.cwd(), serviceAccountPath)
  const rawJson = readFileSync(absolutePath, 'utf8')
  const parsed: unknown = JSON.parse(rawJson)
  const serviceAccount = validateServiceAccountJson(parsed)
  if (!serviceAccount) {
    throw new Error(`Invalid Firebase service account JSON at ${serviceAccountPath}.`)
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: config.firebaseProjectId || serviceAccount.projectId,
  })
  firebaseInitialized = true
}

function isTokenNotRegisteredError(error: unknown): boolean {
  if (error === null || typeof error !== 'object') {
    return false
  }
  const code = Reflect.get(error, 'code')
  return code === 'messaging/registration-token-not-registered'
}

export async function sendFcmToToken(
  token: string,
  notification: FcmNotificationPayload,
): Promise<FcmSendResult> {
  if (!config.firebaseServiceAccountPath) {
    console.error('[fcmClient] FIREBASE_SERVICE_ACCOUNT_PATH is not configured; cannot send push.')
    return { ok: false, reason: 'not-configured' }
  }

  try {
    ensureFirebaseApp()
    await admin.messaging().send({
      token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
    })
    return { ok: true }
  } catch (error) {
    if (isTokenNotRegisteredError(error)) {
      console.log('[fcmClient] FCM token no longer registered; caller should clear pushToken.')
      return { ok: false, reason: 'token-not-registered', clearToken: true }
    }
    console.error('[fcmClient] Failed to send FCM notification:', error)
    return { ok: false, reason: 'send-failed' }
  }
}
