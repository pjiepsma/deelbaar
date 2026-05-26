import { Alert } from 'react-native';

import type { AuthUser } from '../../lib/api/auth/authClient';
import { navigateToAuthStart } from '../../navigation/rootNavigation';

type TranslateFn = (path: string, vars?: Record<string, string>) => string;

export function runMapProtectedAction(params: {
  user: AuthUser | null | undefined;
  allowed: boolean;
  t: TranslateFn;
  beforeAuth?: () => void;
}): void {
  if (!params.user) {
    params.beforeAuth?.();
    navigateToAuthStart();
    return;
  }
  if (!params.allowed) {
    Alert.alert(
      params.t('map.previewActionUnavailableTitle'),
      params.t('map.previewActionUnavailableDescription'),
    );
    return;
  }
  Alert.alert(
    params.t('map.previewActionComingSoonTitle'),
    params.t('map.previewActionComingSoonDescription'),
  );
}
