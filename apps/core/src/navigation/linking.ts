import * as Linking from 'expo-linking';

import type { LinkingOptions } from '@react-navigation/native';

import type { RootStackParamList } from '../features/auth/auth.types';

export const rootLinking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'deelbaar://'],
  config: {
    screens: {
      MainTabs: '',
      Auth: {
        path: 'auth',
        screens: {
          VerifyEmail: {
            path: 'callback',
            parse: {
              email: (value: string) => decodeURIComponent(value),
              code: (value: string) => value.replace(/\D/g, '').slice(0, 6),
            },
          },
        },
      },
    },
  },
};
