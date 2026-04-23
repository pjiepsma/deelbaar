import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getPayloadSdk, payloadSdkTry } from '../../api/payloadSdk';
import { useAuth } from '../../providers/AuthProvider';
import { sqliteManager } from '../../storage/SQLiteManager';
import { syncManager } from '../../storage/SyncManager';

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const local = await sqliteManager.getUser(user.id);
      if (local) return local;

      const { data, error } = await payloadSdkTry(() =>
        getPayloadSdk().findByID({ collection: 'users', id: user.id, depth: 1 })
      );

      if (error) throw new Error(error.message);

      if (data) {
        await sqliteManager.saveUser(data);
      }

      return data || null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profileData: any) => {
      if (!user) throw new Error('Not authenticated');

      await syncManager.queueUpdate('users', user.id, profileData);

      return profileData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useFavorites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) {
        return [];
      }

      try {
        const { data, error } = await payloadSdkTry(() =>
          getPayloadSdk().findByID({ collection: 'users', id: user.id, depth: 1 })
        );

        if (!error && data?.favorites) {
          return data.favorites.map((fav: any) => ({
            id: `${user.id}-${fav.listing?.id || fav.listing}`,
            user: user.id,
            listing: fav.listing,
            createdAt: fav.createdAt || new Date().toISOString(),
            updatedAt: fav.updatedAt || new Date().toISOString(),
          }));
        }
      } catch {
        // fall through to SQLite
      }

      return sqliteManager.getFavorites(user.id);
    },
    enabled: !!user,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ listingId, isFavorite }: { listingId: string; isFavorite: boolean }) => {
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data: userData, error: userError } = await payloadSdkTry(() =>
        getPayloadSdk().findByID({ collection: 'users', id: user.id, depth: 1 })
      );
      if (userError) {
        throw new Error(userError.message);
      }

      const currentFavorites = userData?.favorites || [];

      if (isFavorite) {
        const updatedFavorites = currentFavorites.filter((fav: any) => {
          const favListingId = typeof fav.listing === 'string' ? fav.listing : fav.listing?.id;
          return favListingId !== listingId;
        });

        await sqliteManager.removeFavorite(user.id, listingId);

        await syncManager.queueUpdate('users', user.id, {
          favorites: updatedFavorites,
        });
      } else {
        const newFavorite = { listing: listingId };
        const updatedFavorites = [...currentFavorites, newFavorite];

        await sqliteManager.addFavorite(user.id, listingId);

        await syncManager.queueUpdate('users', user.id, {
          favorites: updatedFavorites,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
