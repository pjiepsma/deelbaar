import { router } from 'expo-router';

import { getAuthFlowPresentation } from './authFlowPresentation';

export function dismissAuthFlow(): void {
  if (getAuthFlowPresentation() === 'embedded') {
    return;
  }
  router.replace('/(tabs)/map');
}
