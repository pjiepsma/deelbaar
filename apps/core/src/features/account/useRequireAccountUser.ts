import { useEffect } from 'react';

import { useAuth } from '../../context/AuthContext';
import type { AuthUser } from '../../lib/api/auth/authClient';
import { navigateToAuthStart } from '../../navigation/rootNavigation';

export function useRequireAccountUser(): AuthUser | null {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigateToAuthStart();
    }
  }, [user]);

  return user;
}
