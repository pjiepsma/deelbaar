import NetInfo from '@react-native-community/netinfo';
import React from 'react';
import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';

import { calculateDistance } from './useLocationQueries';
import { payloadClient } from '../api/PayloadClient';
import { useAuth } from '../providers/AuthProvider';
import { fileQueueManager } from '../storage/FileQueueManager';
import { sqliteManager } from '../storage/SQLiteManager';
import { syncManager } from '../storage/SyncManager';
import { ListingRecord } from '../types/models';

// Listings hooks
export function useListings() {
  return useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      console.log('[useListings] fetching listings');
      const { data, error } = await payloadClient.findMany('listings', {
        limit: 1000,
        depth: 2,
      });

      if (error) {
        if (error.networkError || error.backendUnavailable) {
          console.warn(
            '[useListings] CMS unreachable — see BACKEND UNAVAILABLE in logs; using local cache if any.'
          );
        } else {
          console.error('[useListings] payload error:', error);
        }
        throw new Error(error.message);
      }

      const docs = data?.docs ?? [];
      console.log('[useListings] payload listings count:', docs.length);

      if (docs.length > 0) {
        console.log(
          '[useListings] first listing preview:',
          JSON.stringify(
            docs.slice(0, 2).map((item) => ({
              id: item.id,
              name: item.name,
              category: item.category,
              location: item.location,
            })),
            null,
            2
          )
        );
        await sqliteManager.saveListings(docs);
        return docs;
      }

      const localListings = await sqliteManager.getListings();
      console.log('[useListings] falling back to local cache size:', localListings.length);
      return localListings;
    },
    staleTime: 1000 * 60 * 5,
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

type ClaimListingVariables = {
  listing: ListingRecord;
};

export function useClaimListing() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ listing }: ClaimListingVariables) => {
      if (!user) {
        throw new Error('Log in om een kast te claimen.');
      }

      if (!listing?.id) {
        throw new Error('Onbekende kast.');
      }

      const currentOwner = listing.owner;
      const currentOwnerId = typeof currentOwner === 'object' ? currentOwner?.id : currentOwner;

      if (currentOwnerId) {
        throw new Error('Deze kast is al geclaimd.');
      }

      const userAddress = (user as any)?.address;
      if (!userAddress) {
        throw new Error('Vul je adres in via je profiel om een kast te claimen.');
      }

      const addressParts = [
        typeof userAddress.street === 'string' ? userAddress.street.trim() : '',
        typeof userAddress.houseNumber === 'string' ? userAddress.houseNumber.trim() : '',
        typeof userAddress.postalCode === 'string' ? userAddress.postalCode.trim() : '',
        typeof userAddress.city === 'string' ? userAddress.city.trim() : '',
      ].filter(Boolean);

      if (addressParts.length < 3) {
        throw new Error('Je adres is onvolledig. Vul alle velden in via je profiel.');
      }

      const listingCoords = listing.location?.coordinates;
      const addressString = addressParts.join(' ');
      let distanceMeters: number | null = null;
      let autoApproved = false;

      if (listingCoords && listingCoords.length >= 2) {
        try {
          const geocodeResults = await Location.geocodeAsync(addressString);
          if (geocodeResults?.length) {
            const { latitude, longitude } = geocodeResults[0];
            if (typeof latitude === 'number' && typeof longitude === 'number') {
              const distanceKm = calculateDistance(
                { latitude, longitude },
                { latitude: listingCoords[1], longitude: listingCoords[0] }
              );
              distanceMeters = distanceKm * 1000;

              if (distanceMeters <= 50) {
                await syncManager.queueUpdate('listings', listing.id, { owner: user.id });
                autoApproved = true;
              }
            }
          }
        } catch (error) {
          console.warn('useClaimListing geocode error', error);
        }
      }

      if (!autoApproved) {
        const claimPayload: Record<string, any> = {
          listing: listing.id,
          user: user.id,
          status: 'pending',
          distanceMeters: distanceMeters !== null ? Math.round(distanceMeters) : null,
          addressSnapshot: {
            street: userAddress.street ?? '',
            houseNumber: userAddress.houseNumber ?? '',
            postalCode: userAddress.postalCode ?? '',
            city: userAddress.city ?? '',
          },
        };

        await syncManager.queueCreate('listing-claims', claimPayload);
      }

      return { autoApproved, distanceMeters };
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      if (variables?.listing?.id) {
        queryClient.invalidateQueries({ queryKey: ['listings', variables.listing.id] });
      }
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
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

// Favorites hooks - now uses user.favorites array
export function useFavorites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      console.log('[useFavorites] queryFn called', { userId: user?.id });
      
      if (!user) {
        console.log('[useFavorites] No user, returning empty array');
        return [];
      }

      // Try to get user data with favorites from API first
      try {
        console.log('[useFavorites] Fetching from API', { userId: user.id });
        // depth 1: listing fields for carousel; depth 2 populates listing.owner → other users → 403.
        const { data, error } = await payloadClient.findById('users', user.id, 1);

        if (!error && data?.favorites) {
          // API is available, return fresh favorites with full listing data
          console.log('[useFavorites] Got favorites from API', { count: data.favorites.length });
          const favoritesWithListings = data.favorites.map((fav: any) => ({
            id: `${user.id}-${fav.listing?.id || fav.listing}`, // Generate ID for compatibility
            user: user.id,
            listing: fav.listing,
            createdAt: fav.createdAt || new Date().toISOString(),
            updatedAt: fav.updatedAt || new Date().toISOString(),
          }));
          console.log('[useFavorites] Returning favorites from API', { count: favoritesWithListings.length });
          return favoritesWithListings;
        }
      } catch (error) {
        console.log('[useFavorites] Using local favorites (offline or error)', error);
      }

      // Fallback: get local favorites
      console.log('[useFavorites] Fetching from SQLite', { userId: user.id });
      const local = await sqliteManager.getFavorites(user.id);
      console.log('[useFavorites] Got favorites from SQLite', { count: local.length });
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
      console.log('[useToggleFavorite] mutationFn called', { listingId, isFavorite, userId: user?.id });
      
      if (!user) {
        console.error('[useToggleFavorite] Not authenticated');
        throw new Error('Not authenticated');
      }

      // Get current user data to see existing favorites
      console.log('[useToggleFavorite] Fetching user data', { userId: user.id });
      const { data: userData, error: userError } = await payloadClient.findById(
        'users',
        user.id,
        1
      );
      if (userError) {
        console.error('[useToggleFavorite] Error fetching user data', userError);
        throw new Error(userError.message);
      }

      const currentFavorites = userData?.favorites || [];
      console.log('[useToggleFavorite] Current favorites count', { count: currentFavorites.length });

      if (isFavorite) {
        // Remove favorite - filter out the listing from favorites array
        console.log('[useToggleFavorite] Removing favorite', { listingId });
        const updatedFavorites = currentFavorites.filter((fav: any) => {
          const favListingId = typeof fav.listing === 'string' ? fav.listing : fav.listing?.id;
          return favListingId !== listingId;
        });

        console.log('[useToggleFavorite] Updated favorites count after removal', { count: updatedFavorites.length });

        // Update local SQLite immediately (offline-first)
        await sqliteManager.removeFavorite(user.id, listingId);
        console.log('[useToggleFavorite] Removed from SQLite');

        // Queue user update for sync
        await syncManager.queueUpdate('users', user.id, {
          favorites: updatedFavorites,
        });
        console.log('[useToggleFavorite] Queued user update for sync');
      } else {
        // Add favorite - append to favorites array
        console.log('[useToggleFavorite] Adding favorite', { listingId });
        const newFavorite = { listing: listingId };
        const updatedFavorites = [...currentFavorites, newFavorite];

        console.log('[useToggleFavorite] Updated favorites count after addition', { count: updatedFavorites.length });

        // Update local SQLite immediately (offline-first)
        await sqliteManager.addFavorite(user.id, listingId);
        console.log('[useToggleFavorite] Added to SQLite');

        // Queue user update for sync
        await syncManager.queueUpdate('users', user.id, {
          favorites: updatedFavorites,
        });
        console.log('[useToggleFavorite] Queued user update for sync');
      }
    },
    onSuccess: () => {
      console.log('[useToggleFavorite] Mutation succeeded, invalidating queries');
      // Invalidate all favorites queries (including ['favorites', user?.id])
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      // Also invalidate profile since favorites are part of user data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      console.log('[useToggleFavorite] Queries invalidated');
    },
    onError: (error) => {
      console.error('[useToggleFavorite] Mutation failed', error);
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
      photos?: { uri: string; type: string; name: string }[];
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
          _queued: true,
        };
      }

      // Upload immediately if online
      const { data, error } = await payloadClient.uploadFile(file, alt);
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

// Moderation notifications hook
export function useModerationNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!user?.id) return;

    // Monitor for photo status changes
    const checkForModerationUpdates = async () => {
      try {
        // Get user's listings to check for photo status changes
        const listings = await sqliteManager.getListingsByOwner(user.id);

        for (const listing of listings) {
          if (listing?.pictures) {
            // Check if any photos transitioned from pending to approved/rejected
            const pendingPhotos = listing.pictures.filter((pic: any) => pic.status === 'pending');
            if (pendingPhotos.length > 0) {
              // Compare with server state
              const { data: serverListing } = await payloadClient.findById('listings', listing.id, 2);
              if (serverListing?.pictures) {
                for (const serverPic of serverListing.pictures) {
                  const localPic = listing.pictures.find((p: any) => p.id === serverPic.id);
                  if (localPic && localPic.status === 'pending' && serverPic.status !== 'pending') {
                    // Status changed! Show notification
                    const action = serverPic.status === 'approved' ? 'goedgekeurd' : 'afgewezen';
                    Alert.alert(
                      `Foto ${action}! 🎉`,
                      `Je foto voor "${listing.name}" is ${action} door de beheerder en ${serverPic.status === 'approved' ? 'nu zichtbaar' : 'helaas afgewezen'}.`,
                      [{ text: 'Geweldig!' }]
                    );

                    // Update local status to match server
                    const updatedPictures = listing.pictures.map((p: any) =>
                      p.id === serverPic.id ? { ...p, status: serverPic.status } : p
                    );
                    await sqliteManager.saveListings([{
                      ...listing,
                      pictures: updatedPictures,
                    }]);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn('[useModerationNotifications] Error checking for updates:', error);
      }
    };

    // Check every 30 seconds when app is active
    const interval = setInterval(checkForModerationUpdates, 30000);

    // Also check immediately
    checkForModerationUpdates();

    return () => clearInterval(interval);
  }, [user?.id, queryClient]);
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

      // Get listing with pictures array
      const { data, error } = await payloadClient.findById('listings', listingId, 2); // depth 2 to get full picture data
      if (error) throw new Error(error.message);

      const allPictures = data?.pictures || [];

      // Filter by status if specified
      if (status) {
        return allPictures.filter((pic: any) => pic.status === status);
      }

      return allPictures;
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

      if (netInfo.isConnected) {
        // Online flow: upload immediately
        const uploadResult = await payloadClient.uploadFile(file, `Listing photo for ${listingId}`);
        if (uploadResult.error) {
          throw new Error(uploadResult.error.message || 'Upload mislukt');
        }

        const mediaId = uploadResult.data?.id;
        if (!mediaId) {
          throw new Error('Upload gaf geen media-ID terug');
        }

        // Get current listing to see existing pictures
        const { data: listingData, error: listingError } = await payloadClient.findById(
          'listings',
          listingId,
          1
        );
        if (listingError) throw new Error(listingError.message);

        const currentPictures = listingData?.pictures || [];

        // Add new picture to the array
        const newPicture = {
          photo: mediaId,
          created_by: user.id,
          status: 'pending' as const,
        };

        const updatedPictures = [...currentPictures, newPicture];

        // Update the listing with the new pictures array
        const { error: updateError } = await payloadClient.update('listings', listingId, {
          pictures: updatedPictures,
        });

        if (updateError) {
          throw new Error(updateError.message || 'Kon fotoverzoek niet opslaan');
        }
      } else {
        // Offline flow: queue file and create local placeholder
        const tempFileId = await fileQueueManager.queueFile({
          uri: file.uri,
          type: file.type,
          name: file.name,
          alt: `Listing photo for ${listingId}`,
          relatedCollection: 'listings',
          relatedId: listingId,
        });

        // Get current listing from local SQLite for offline updates
        const localListing = await sqliteManager.getListingById(listingId);
        const currentPictures = localListing?.pictures || [];

        // Create placeholder picture with temporary ID
        const tempPictureId = `temp_picture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newPicture = {
          id: tempPictureId,
          photo: tempFileId, // Reference to queued file
          created_by: user.id,
          status: 'queued' as const, // New status for queued photos
          createdAt: new Date().toISOString(),
        };

        const updatedPictures = [...currentPictures, newPicture];

        // Queue the listing update with pending photo reference
        await syncManager.queueUpdate('listings', listingId, {
          pictures: updatedPictures,
          _pendingPhotos: [tempFileId], // Track which photos need to be uploaded
        });

        // Update local SQLite immediately for offline-first experience
        await sqliteManager.saveListings([{
          ...localListing,
          pictures: updatedPictures,
        }]);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['listingPhotos', variables.listingId] });
      queryClient.invalidateQueries({
        queryKey: ['listingPhotos', variables.listingId, 'pending'],
      });
      queryClient.invalidateQueries({
        queryKey: ['listingPhotos', variables.listingId, 'approved'],
      });
      queryClient.invalidateQueries({ queryKey: ['listings', variables.listingId] }); // Also invalidate the listing itself
    },
  });
}

export function useReviewListingPhoto() {
  const { user } = useAuth();
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
      if (!user) throw new Error('Not authenticated');

      const netInfo = await NetInfo.fetch();

      // Get current listing data
      const { data: listingData, error: listingError } = await payloadClient.findById(
        'listings',
        listingId,
        1
      );
      if (listingError) throw new Error(listingError.message);

      const currentPictures = listingData?.pictures || [];

      // Update the specific picture in the array
      // For now, use array index as identifier (pictureId should be the index)
      const pictureIndex = parseInt(pictureId);
      if (isNaN(pictureIndex) || pictureIndex < 0 || pictureIndex >= currentPictures.length) {
        throw new Error('Ongeldige foto identifier');
      }

      const updatedPictures = [...currentPictures];
      const currentPicture = updatedPictures[pictureIndex];

      updatedPictures[pictureIndex] = {
        ...currentPicture,
        status,
        approved_by: status === 'approved' ? user.id : null,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
        rejection_reason: status === 'rejected' ? rejectionReason || null : null,
      };

      const payload = {
        pictures: updatedPictures,
      };

      if (!netInfo.isConnected) {
        await syncManager.queueUpdate('listings', listingId, payload);
        return { queued: true };
      }

      const { error } = await payloadClient.update('listings', listingId, payload);
      if (error) {
        throw new Error(error.message || 'Kon foto-aanvraag niet bijwerken');
      }

      return { queued: false };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['listingPhotos', variables.listingId] });
      queryClient.invalidateQueries({
        queryKey: ['listingPhotos', variables.listingId, 'pending'],
      });
      queryClient.invalidateQueries({
        queryKey: ['listingPhotos', variables.listingId, 'approved'],
      });
      queryClient.invalidateQueries({ queryKey: ['listings', variables.listingId] });
    },
  });
}
