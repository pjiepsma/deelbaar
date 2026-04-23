import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getPayloadSdk, payloadSdkTry } from '../../api/payloadSdk';
import { useAuth } from '../../providers/AuthProvider';
import { fileQueueManager } from '../../storage/FileQueueManager';
import { syncManager } from '../../storage/SyncManager';

export function useReviews(listingId: string | null) {
  return useQuery({
    queryKey: ['reviews', listingId],
    queryFn: async () => {
      if (!listingId) return [];

      const { data, error } = await payloadSdkTry(() =>
        getPayloadSdk().find({
          collection: 'reviews',
          where: { listing: { equals: listingId } },
          limit: 1000,
          depth: 1,
        })
      );

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

      await syncManager.queueCreate('reviews', {
        rating: reviewData.rating,
        description: reviewData.description,
        listing: reviewData.listing,
        created_by: user.id,
        _tempId: tempReviewId,
        _pendingPhotos: photoIds,
      });

      return { ...reviewData, id: tempReviewId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}
