import type { CmsLegalPage } from '../../lib/legal/cmsLegal.types';
import type { MapPlaceCollection } from '../../lib/mapPlaces/mapPlaceTaxonomy';

/** Legacy param shapes — routes live under `apps/core/app/`. */
export type AuthRouteParams = {
  loginEmail: { initialEmail?: string };
  signUp: { initialEmail?: string };
  forgotPassword: { initialEmail?: string };
  forgotPasswordSent: { email: string };
  verifyEmail: { email?: string; code?: string };
  notifications: { source: 'signup' | 'postLogin' };
  allowLocation: { source: 'signup' | 'postLogin' };
  listing: { collection: MapPlaceCollection; id: number };
  legal: { page: CmsLegalPage };
};
