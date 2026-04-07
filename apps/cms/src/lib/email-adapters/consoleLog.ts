import { existsSync, mkdirSync, writeFile } from 'fs'
import path from 'path'
import { EmailAdapter } from 'payload'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default function getDevEmailAdapter(): EmailAdapter | Promise<EmailAdapter> | undefined {
  return () => {
    return {
      defaultFromAddress: 'noreply@deelbaar.com',
      defaultFromName: 'Deelbaar',
      name: 'Dev Email Adapter',
      sendEmail: async ({ to, subject, html }) => {
        console.log('------------- DEV EMAIL ADAPTER --------------')
        console.log('Sending email to:', to)
        console.log('Subject:', subject)
        console.log('HTML:', html)
        console.log('----------------------------------------------')

        if (!existsSync(path.resolve(dirname, '../../../emails'))) {
          mkdirSync(path.resolve(dirname, '../../../emails'))
        }

        writeFile(
          path.resolve(dirname, '../../../emails', `${Date.now()}.html`),
          html,
          { flag: 'wx' },
          () => {},
        )
      },
    }
  }
}









