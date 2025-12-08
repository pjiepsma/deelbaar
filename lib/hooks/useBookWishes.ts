import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { payloadClient } from '~/lib/api/PayloadClient';
import { useAuth } from '~/lib/providers/AuthProvider';

interface BookWish {
  id: string;
  title: string;
  author?: string;
  isbn?: string;
  description?: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // km
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateBookWishData {
  title: string;
  author?: string;
  isbn?: string;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

export const useBookWishes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bookWishes', user?.id],
    queryFn: () => payloadClient.getBookWishes(),
    enabled: !!user, // Only run when user is logged in
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateBookWish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wishData: CreateBookWishData) => payloadClient.createBookWish(wishData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookWishes'] });
      queryClient.invalidateQueries({ queryKey: ['matchingWishes'] });
    },
  });
};

export const useDeleteBookWish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wishId: string) => payloadClient.deleteBookWish(wishId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookWishes'] });
      queryClient.invalidateQueries({ queryKey: ['matchingWishes'] });
    },
  });
};

export const useMatchingWishes = (bookData: { title: string; author?: string; isbn?: string }) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['matchingWishes', bookData, user?.id],
    queryFn: () => payloadClient.getMatchingWishes(bookData),
    enabled: !!user && !!bookData.title, // Only run if user is logged in and we have a title
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export type { BookWish, CreateBookWishData };
