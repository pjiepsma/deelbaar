import { useMemo } from 'react';

import { useAuth } from '~/lib/providers/AuthProvider';

export type SearchScope = 'city' | 'province' | 'country' | 'world';

export const SEARCH_SCOPE_ORDER: SearchScope[] = ['city', 'province', 'country', 'world'];

export function useSearchAccess() {
  const { user } = useAuth();
  const isLoggedIn = !!user?.id;
  const access = (user as any)?.searchAccess as
    | { province?: boolean; country?: boolean; world?: boolean }
    | undefined;

  const unlockedScopes = useMemo(() => {
    const unlocked = new Set<SearchScope>(['city']);
    if (!isLoggedIn) return unlocked;
    if (access?.province) unlocked.add('province');
    if (access?.country) unlocked.add('country');
    if (access?.world) unlocked.add('world');
    return unlocked;
  }, [access?.country, access?.province, access?.world, isLoggedIn]);

  const canUseScope = (scope: SearchScope) => unlockedScopes.has(scope);

  return {
    isLoggedIn,
    unlockedScopes,
    canUseScope,
  };
}
