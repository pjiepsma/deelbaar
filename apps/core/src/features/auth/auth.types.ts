import type { NavigatorScreenParams } from '@react-navigation/native';

import type { CmsLegalPage } from '../../lib/legal/cmsLegal.types';
import type { MapPlaceCollection } from '../../lib/mapPlaces/mapPlaceTaxonomy';

export type AuthStackParamList = {
  AuthStart: undefined;
  LoginEmail: { initialEmail?: string } | undefined;
  SignUpEmailWizard: { initialEmail?: string } | undefined;
  ForgotPassword: { initialEmail?: string } | undefined;
  ForgotPasswordEmailSent: { email: string };
  ResetPassword: undefined;
  VerifyEmail: { email?: string; code?: string };
  WelcomeSignedUp: undefined;
  SignUpNotifications: { source: 'signup' | 'postLogin' };
  AllowLocation: { source: 'signup' | 'postLogin' };
};

export type RootStackParamList = {
  MainTabs: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  ListingDetail: { collection: MapPlaceCollection; id: number };
  LegalDocument: { page: CmsLegalPage };
};
