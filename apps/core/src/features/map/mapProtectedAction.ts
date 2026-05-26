import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { Alert } from 'react-native';

import type { AuthUser } from '../../lib/api/auth/authClient';
import { navigateToAuthModal } from '../../navigation/rootNavigation';

type TranslateFn = (path: string, vars?: Record<string, string>) => string;

export function runMapProtectedAction(params: {
  user: AuthUser | null | undefined;
  navigation: NavigationProp<ParamListBase>;
  allowed: boolean;
  t: TranslateFn;
  beforeAuth?: () => void;
}): void {
  if (!params.user) {
    params.beforeAuth?.();
    navigateToAuthModal(params.navigation);
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
