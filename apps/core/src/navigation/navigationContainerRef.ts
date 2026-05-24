import { createNavigationContainerRef } from '@react-navigation/native';

import type { RootStackParamList } from '../features/auth/auth.types';

export const navigationContainerRef = createNavigationContainerRef<RootStackParamList>();
