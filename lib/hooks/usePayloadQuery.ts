import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

import { payloadClient } from '../api/PayloadClient';
import { useAuth } from '../providers/AuthProvider';
import { fileQueueManager } from '../storage/FileQueueManager';
import { sqliteManager } from '../storage/SQLiteManager';
import { syncManager } from '../storage/SyncManager';

// Listings hooks
export function useListings() {
  return useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      try {
        // Try to get from local DB first
        const localListings = await sqliteManager.getListings();
      
        // If we have local data, return it immediately
        if (localListings.length > 0) {
          return localListings;
        }

        // Otherwise fetch from API
        const { data, error } = await payloadClient.findMany('listings', {
          limit: 1000,
          depth: 1,
        });

        if (error) throw new Error(error.message);

        // Save to local DB
        if (data?.docs) {
          await sqliteManager.saveListings(data.docs);
          return data.docs;
        }

        return [];
      } catch (error) {
        console.error('Error fetching listings:', error);
        // Return empty array on error, don't throw
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useListing(id: string | null) {
  return useQuery({
    queryKey: ['listings', id],
    queryFn: async () => {
      if (!id) return null;

      // Try local first
      const local = await sqliteManager.getListingById(id);
      if (local) return local;

      // Fetch from API
      const { data, error } = await payloadClient.findById('listings', id, 2);
      if (error) throw new Error(error.message);

      return data;
    },
    enabled: !!id,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (listingData: any) => {
      if (!user) throw new Error('Not authenticated');

      // Generate temporary ID
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamps = {
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      const listing = {
        ...listingData,
        ...timestamps,
        id: tempId,
        owner_id: user.id,
        owner: user.id,
      };

      // Save to local DB
      await sqliteManager.createLocalListing(listing);

      // Queue for sync
      await syncManager.queueCreate('listings', {
        ...listingData,
        owner: user.id,
      });

      return listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await syncManager.queueUpdate('listings', id, data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await syncManager.queueDelete('listings', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

// User/Profile hooks
export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Try local cache first
      const local = await sqliteManager.getUser(user.id);
      if (local) return local;

      // Fetch from API
      const { data, error } = await payloadClient.findById('users', user.id, 1);

      if (error) throw new Error(error.message);

      if (data) {
        await sqliteManager.saveUser(data);
      }

      return data || null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profileData: any) => {
      if (!user) throw new Error('Not authenticated');

      // Update user profile fields
      await syncManager.queueUpdate('users', user.id, profileData);

      return profileData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// Favorites hooks
export function useFavorites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Always get local data first (offline-first)
      const local = await sqliteManager.getFavorites(user.id);

      // Try to sync with API in the background
      try {
        const { data, error } = await payloadClient.findMany('favorites', {
          where: { user: { equals: user.id } },
          limit: 1000,
        });

        if (!error && data?.docs) {
          // API is available, return fresh data
          return data.docs;
        }
      } catch (error) {
        // API is offline, just use local data
        console.log('Using local favorites (offline or error)');
      }

      // Return local data (whether API failed or not)
      return local;
    },
    enabled: !!user,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ listingId, isFavorite }: { listingId: string; isFavorite: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (isFavorite) {
        // Remove favorite from SQLite immediately (offline-first)
        await sqliteManager.removeFavorite(user.id, listingId);
        
        // Try to find the favorite ID and queue deletion
        try {
          const { data } = await payloadClient.findMany('favorites', {
            where: {
              user: { equals: user.id },
              listing: { equals: listingId },
            },
          });
          const favoriteId = data?.docs?.[0]?.id;
          if (favoriteId) {
            await syncManager.queueDelete('favorites', favoriteId);
          }
        } catch (error) {
          // If offline or error, just log it - the local removal already succeeded
          console.log('Could not queue favorite deletion (offline or error):', error);
        }
      } else {
        // Add favorite to SQLite immediately (offline-first)
        await sqliteManager.addFavorite(user.id, listingId);
        
        // Queue for sync when online
        await syncManager.queueCreate('favorites', {
          user: user.id,
          listing: listingId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

// Reviews hooks
export function useReviews(listingId: string | null) {
  return useQuery({
    queryKey: ['reviews', listingId],
    queryFn: async () => {
      if (!listingId) return [];

      const { data, error } = await payloadClient.findMany('reviews', {
        where: { listing: { equals: listingId } },
        limit: 1000,
        depth: 1,
      });

      if (error) throw new Error(error.message);

      return data?.docs || [];
    },
    enabled: !!listingId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (reviewData: {
      rating: number;
      description: string;
      listing: string;
      photos?: Array<{ uri: string; type: string; name: string }>;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const tempReviewId = `temp_review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Queue photos for upload if any
      const photoIds: string[] = [];
      if (reviewData.photos && reviewData.photos.length > 0) {
        for (const photo of reviewData.photos) {
          const fileId = await fileQueueManager.queueFile({
            uri: photo.uri,
            type: photo.type,
            name: photo.name,
            alt: `Review photo for ${reviewData.listing}`,
            relatedCollection: 'reviews',
            relatedId: tempReviewId,
          });
          photoIds.push(fileId);
        }
      }

      // Queue review creation (will include photo IDs once uploaded)
      await syncManager.queueCreate('reviews', {
        rating: reviewData.rating,
        description: reviewData.description,
        listing: reviewData.listing,
        created_by: user.id,
        _tempId: tempReviewId,
        _pendingPhotos: photoIds, // Track which photos need to be uploaded
      });

      return { ...reviewData, id: tempReviewId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

// Upload hooks
export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ 
      file, 
      alt,
      relatedCollection,
      relatedId,
    }: { 
      file: { uri: string; type: string; name: string }; 
      alt?: string;
      relatedCollection?: string;
      relatedId?: string;
    }) => {
      // Check if online
      const netInfo = await NetInfo.fetch();
      
      if (!netInfo.isConnected) {
        // Queue for later upload
        const fileId = await fileQueueManager.queueFile({
          uri: file.uri,
          type: file.type,
          name: file.name,
          alt,
          relatedCollection,
          relatedId,
        });
        
        return { 
          id: fileId, 
          url: file.uri, // Use local URI for now
          _queued: true 
        };
      }

      // Upload immediately if online
      const { data, error } = await payloadClient.uploadFile(file, alt);
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

// Get queued files count
export function useQueuedFiles() {
  return useQuery({
    queryKey: ['queuedFiles'],
    queryFn: async () => {
      const queue = fileQueueManager.getQueue();
      return {
        count: queue.length,
        files: queue,
      };
    },
    refetchInterval: 5000, // Check every 5 seconds
  });
}

// Listings for current user
export function useMyListings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['myListings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const localListings = await sqliteManager.getListingsByOwner(user.id);
      if (localListings.length > 0) {
        return localListings;
      }

      const { data, error } = await payloadClient.findMany('listings', {
        where: {
          owner: {
            equals: user.id,
          },
        },
        limit: 200,
        depth: 1,
      });

      if (error) throw new Error(error.message);

      if (data?.docs) {
        await sqliteManager.saveListings(data.docs);
        return data.docs;
      }

      return [];
    },
    enabled: !!user?.id,
  });
}

export type PictureStatus = 'pending' | 'approved' | 'rejected';

export function useListingPhotos(
  listingId: string | null,
  status?: PictureStatus,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['listingPhotos', listingId, status],
    queryFn: async () => {
      if (!listingId) return [];

      const where: Record<string, any> = {
        listing: {
          equals: listingId,
        },
      };

      if (status) {
        where.status = {
          equals: status,
        };
      }

      const { data, error } = await payloadClient.findMany('pictures', {
        where,
        depth: 2,
        limit: 200,
      });

      if (error) throw new Error(error.message);

      return data?.docs || [];
    },
    enabled: options?.enabled ?? !!listingId,
  });
}

export function useRequestListingPhoto() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      file,
    }: {
      listingId: string;
      file: { uri: string; type: string; name: string };
    }) => {
      if (!user) throw new Error('Not authenticated');

      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('Internetverbinding is nodig om een foto te uploaden.');
      }

      const uploadResult = await payloadClient.uploadFile(file, `Listing photo for ${listingId}`);
      if (uploadResult.error) {
        throw new Error(uploadResult.error.message || 'Upload mislukt');
      }

      const mediaId = uploadResult.data?.id;
      if (!mediaId) {
        throw new Error('Upload gaf geen media-ID terug');
      }

      const { error: createError } = await payloadClient.create('pictures', {
        listing: listingId,
        photo: mediaId,
      });

      if (createError) {
        throw new Error(createError.message || 'Kon fotoverzoek niet opslaan');
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['listingPhotos', variables.listingId] });
      queryClient.invalidateQueries({ queryKey: ['listingPhotos', variables.listingId, 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['listingPhotos', variables.listingId, 'approved'] });
    },
  });
}

export function useReviewListingPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pictureId,
      listingId,
      status,
      rejectionReason,
    }: {
      pictureId: string;
      listingId: string;
      status: Exclude<PictureStatus, 'pending'>;
      rejectionReason?: string;
    }) => {
      const netInfo = await NetInfo.fetch();

      const payload = {
        status,
        rejection_reason: status === 'rejected' ? rejectionReason || null : null,
      };

      if (!netInfo.isConnected) {
        await syncManager.queueUpdate('pictures', pictureId, payload);
        return { queued: true };
      }

      const { error } = await payloadClient.update('pictures', pictureId, payload);
      if (error) {
        throw new Error(error.message || 'Kon foto-aanvraag niet bijwerken');
      }

      return { queued: false };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['listingPhotos', variables.listingId] });
      queryClient.invalidateQueries({ queryKey: ['listingPhotos', variables.listingId, 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['listingPhotos', variables.listingId, 'approved'] });
    },
  });
}

