import { config } from '@/config/config'
import { generateMail } from '@/globals/Mail/utilities/sendMail'
import type { PayloadRequest } from 'payload'

import { generateSignupOtpDigits, hashSignupOtp, SIGNUP_OTP_TTL_MS } from './signupOtp'

function mobileAuthScheme(): string {
  return process.env.MOBILE_AUTH_CALLBACK_SCHEME?.trim() || 'deelbaar'
}

function verificationAppendix(plainOtp: string, deepLink: string): string {
  return `
<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;" />
<p style="font-size:14px;margin:0 0 8px;">Your verification code (copy into the app):</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:0 0 16px;font-family:monospace;">${plainOtp}</p>
<p style="font-size:14px;margin:0;">
  <a href="${deepLink.replace(/"/g, '&quot;')}" style="color:#2563eb;">Open in the Deelbaar app</a>
</p>
`.trim()
}

export async function issueSignupOtpAndBuildVerificationEmail(args: {
  req: PayloadRequest
  token: string
  user: { id: number | string; email: string; name?: string | null; surname?: string | null }
}): Promise<string> {
  const plainOtp = generateSignupOtpDigits()
  const otpHash = hashSignupOtp(plainOtp)
  const expiresAt = new Date(Date.now() + SIGNUP_OTP_TTL_MS).toISOString()

  await args.req.payload.update({
    collection: 'users',
    id: args.user.id,
    data: {
      signupOtpHash: otpHash,
      signupOtpExpiresAt: expiresAt,
    },
    req: args.req,
    overrideAccess: true,
  })

  const baseUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || config.publicServerUrl
  const verificationUrl = `${baseUrl}/verify?token=${encodeURIComponent(args.token)}`
  const displayName =
    args.user.name || args.user.surname
      ? `${args.user.name ?? ''} ${args.user.surname ?? ''}`.trim()
      : args.user.email

  const { body } = await generateMail({
    type: 'verify',
    placeholders: {
      userName: displayName,
      verificationUrl,
    },
    req: args.req,
  })

  const scheme = mobileAuthScheme()
  const deepLink = `${scheme}://auth/callback?${new URLSearchParams({
    code: plainOtp,
    email: args.user.email,
  }).toString()}`

  return `${body}${verificationAppendix(plainOtp, deepLink)}`
}
