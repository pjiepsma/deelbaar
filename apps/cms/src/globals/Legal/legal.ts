import { isAdmin } from '@/access/isAdmin';
import { GlobalConfig } from 'payload';

const legalPageFields = [
  {
    name: 'title',
    type: 'text' as const,
    required: true,
  },
  {
    name: 'body',
    type: 'textarea' as const,
    required: true,
  },
];

export const Legal: GlobalConfig = {
  slug: 'legal',
  label: 'Legal pages',
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: 'terms',
      type: 'group',
      label: 'Terms of service',
      fields: legalPageFields,
    },
    {
      name: 'privacy',
      type: 'group',
      label: 'Privacy policy',
      fields: legalPageFields,
    },
    {
      name: 'about',
      type: 'group',
      label: 'About',
      fields: legalPageFields,
    },
  ],
};
