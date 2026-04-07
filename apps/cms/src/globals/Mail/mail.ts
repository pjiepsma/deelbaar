import { isAdmin } from '@/access/isAdmin'
import { GlobalConfig } from 'payload'
import { createMailTab } from './utilities/createMailTab'

export const Mail: GlobalConfig = {
  slug: 'mail',
  access: {
    read: isAdmin,
    readVersions: isAdmin,
    update: isAdmin,
  },
  lockDocuments: false,
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'headerLogo',
          label: 'Header logo',
          type: 'upload',
          required: true,
          relationTo: 'media',
          hasMany: false,
        },
        {
          name: 'footerLogo',
          label: 'Footer logo',
          type: 'upload',
          required: true,
          relationTo: 'media',
          hasMany: false,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'businessEmail',
          label: 'Business emailadres',
          type: 'email',
          required: true,
          defaultValue: 'noreply@deelbaar.com',
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        createMailTab({
          label: 'Email Verificatie',
          name: 'verify',
          placeholders: ['userName', 'verificationUrl'],
        }),
        createMailTab({
          label: 'Wachtwoord Reset',
          name: 'forgotPassword',
          placeholders: ['userName', 'resetUrl'],
        }),
      ],
    },
  ],
}









