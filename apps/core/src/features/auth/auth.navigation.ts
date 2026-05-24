import type { NavigationProp } from '@react-navigation/native';

import { getAuthFlowPresentation } from './authFlowPresentation';
import type { RootStackParamList } from './auth.types';

export function dismissAuthFlow(navigation: NavigationProp<Record<string, object | undefined>>): void {
  if (getAuthFlowPresentation() === 'embedded') {
    return;
  }
  const parent = navigation.getParent<NavigationProp<RootStackParamList>>();
  if (parent?.canGoBack()) {
    parent.goBack();
    return;
  }
  parent?.navigate('MainTabs');
}
