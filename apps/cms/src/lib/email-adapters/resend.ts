import { resendAdapter } from '@payloadcms/email-resend'

export function getResendAdapter() {
  return resendAdapter({
    defaultFromAddress: process.env.MAIL_FROM_ADDRESS || 'noreply@deelbaar.com',
    defaultFromName: process.env.MAIL_FROM_NAME || 'Deelbaar',
    apiKey: process.env.MAIL_API_KEY || '',
  })
}









