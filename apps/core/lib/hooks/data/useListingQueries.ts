import NetInfo from '@react-native-community/netinfo';
import React from 'react';
import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';

import { getPayloadSdk, payloadSdkTry } from '../../api/payloadSdk';
import { payloadClient } from '../../api/PayloadClient';
import { useAuth } from '../../providers/AuthProvider';
import { fileQueueManager } from '../../storage/FileQueueManager';
import { sqliteManager } from '../../storage/SQLiteManager';
import { syncManager } from '../../storage/SyncManager';
import { ListingRecord } from '../../types/models';
import { calculateDistance } from '../useLocationQueries';

export function useListings() {
  return useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      const { data, error } = await payloadSdkTry(() =>
        getPayloadSdk().find({ collection: 'listings', limit: 1000, depth: 2 })
      );

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

      if (docs.length > 0) {
        await sqliteManager.saveListings(docs);
        return docs;
      }

      return sqliteManager.getListings();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useListing(id: string | null) {
  return useQuery({
    queryKey: ['listings', id],
    queryFn: async () => {
      if (!id) return null;

      const local = await sqliteManager.getListingById(id);
      if (local) return local;

      const { data, error } = await payloadSdkTry(() =>
        getPayloadSdk().findByID({ collection: 'listings', id, depth: 1 })
      );
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

      await sqliteManager.createLocalListing(listing);

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

export function useModerationNotifications() {
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user?.id) return;

    const checkForModerationUpdates = async () => {
      try {
        const listings = await sqliteManager.getListingsByOwner(user.id);

        for (const listing of listings) {
          if (listing?.pictures) {
            const pendingPhotos = listing.pictures.filter((pic: any) => pic.status === 'pending');
            if (pendingPhotos.length > 0) {
              const { data: serverListing } = await payloadSdkTry(() =>
                getPayloadSdk().findByID({ collection: 'listings', id: listing.id, depth: 2 })
              );
              if (serverListing?.pictures) {
                for (const serverPic of serverListing.pictures) {
                  const localPic = listing.pictures.find((p: any) => p.id === serverPic.id);
                  if (localPic && localPic.status === 'pending' && serverPic.status !== 'pending') {
                    const action = serverPic.status === 'approved' ? 'goedgekeurd' : 'afgewezen';
                    Alert.alert(
                      `Foto ${action}! 🎉`,
                      `Je foto voor "${listing.name}" is ${action} door de beheerder en ${serverPic.status === 'approved' ? 'nu zichtbaar' : 'helaas afgewezen'}.`,
                      [{ text: 'Geweldig!' }]
                    );

                    const updatedPictures = listing.pictures.map((p: any) =>
                      p.id === serverPic.id ? { ...p, status: serverPic.status } : p
                    );
                    await sqliteManager.saveListings([
                      {
                        ...listing,
                        pictures: updatedPictures,
                      },
                    ]);
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

    const interval = setInterval(checkForModerationUpdates, 30000);
    checkForModerationUpdates();

    return () => clearInterval(interval);
  }, [user?.id]);
}

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

      const { data, error } = await payloadSdkTry(() =>
        getPayloadSdk().find({
          collection: 'listings',
          where: {
            owner: {
              equals: user.id,
            },
          },
          limit: 200,
          depth: 1,
        })
      );

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

      const { data, error } = await payloadSdkTry(() =>
        getPayloadSdk().findByID({ collection: 'listings', id: listingId, depth: 2 })
      );
      if (error) throw new Error(error.message);

      const allPictures = data?.pictures || [];

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
        const uploadResult = await payloadClient.uploadFile(file, `Listing photo for ${listingId}`);
        if (uploadResult.error) {
          throw new Error(uploadResult.error.message || 'Upload mislukt');
        }

        const mediaId = uploadResult.data?.id;
        if (!mediaId) {
          throw new Error('Upload gaf geen media-ID terug');
        }

        const { data: listingData, error: listingError } = await payloadSdkTry(() =>
          getPayloadSdk().findByID({ collection: 'listings', id: listingId, depth: 1 })
        );
        if (listingError) throw new Error(listingError.message);

        const currentPictures = listingData?.pictures || [];

        const newPicture = {
          photo: mediaId,
          created_by: user.id,
          status: 'pending' as const,
        };

        const updatedPictures = [...currentPictures, newPicture];

        const { error: updateError } = await payloadSdkTry(() =>
          getPayloadSdk().update({
            collection: 'listings',
            id: listingId,
            data: { pictures: updatedPictures },
          })
        );

        if (updateError) {
          throw new Error(updateError.message || 'Kon fotoverzoek niet opslaan');
        }
      } else {
        const tempFileId = await fileQueueManager.queueFile({
          uri: file.uri,
          type: file.type,
          name: file.name,
          alt: `Listing photo for ${listingId}`,
          relatedCollection: 'listings',
          relatedId: listingId,
        });

        const localListing = await sqliteManager.getListingById(listingId);
        const currentPictures = localListing?.pictures || [];

        const tempPictureId = `temp_picture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newPicture = {
          id: tempPictureId,
          photo: tempFileId,
          created_by: user.id,
          status: 'queued' as const,
          createdAt: new Date().toISOString(),
        };

        const updatedPictures = [...currentPictures, newPicture];

        await syncManager.queueUpdate('listings', listingId, {
          pictures: updatedPictures,
          _pendingPhotos: [tempFileId],
        });

        await sqliteManager.saveListings([
          {
            ...localListing,
            pictures: updatedPictures,
          },
        ]);
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
      queryClient.invalidateQueries({ queryKey: ['listings', variables.listingId] });
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

      const { data: listingData, error: listingError } = await payloadSdkTry(() =>
        getPayloadSdk().findByID({ collection: 'listings', id: listingId, depth: 1 })
      );
      if (listingError) throw new Error(listingError.message);

      const currentPictures = listingData?.pictures || [];

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

      const { error } = await payloadSdkTry(() =>
        getPayloadSdk().update({ collection: 'listings', id: listingId, data: payload })
      );
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
