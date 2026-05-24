import { createHash, randomInt, timingSafeEqual } from 'crypto'

export const SIGNUP_OTP_TTL_MS = 15 * 60 * 1000

export function generateSignupOtpDigits(): string {
  return String(randomInt(100_000, 1_000_000))
}

export function hashSignupOtp(code: string): string {
  return createHash('sha256').update(code, 'utf8').digest('hex')
}

export function timingSafeOtpHashMatch(code: string, storedHash: string | null | undefined): boolean {
  if (!storedHash || typeof storedHash !== 'string') {
    return false
  }
  const computed = hashSignupOtp(code)
  try {
    return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(storedHash, 'hex'))
  } catch {
    return false
  }
}
