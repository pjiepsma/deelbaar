import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { payloadClient } from '~/lib/api/PayloadClient';

interface ProductOffering {
  id: string;
  listingId: string;
  listing?: {
    id: string;
    name: string;
    category: string;
    location: {
      latitude: number;
      longitude: number;
    };
  };
  productName: string;
  description?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  category?: string;
  usageInstructions?: string; // Voor Repair Cafés - veiligheidsinstructies, gebruikstips
  photos?: string[]; // Array van foto URLs
  openingHours?: string; // Openingstijden van de kast
  approvalStatus: 'pending' | 'approved' | 'rejected'; // Goedkeuring status
  submittedBy?: {
    id: string;
    email: string;
    name?: string;
  };
  status: 'available' | 'out_of_stock' | 'reserved';
  availableUntil?: string;
  createdBy: {
    id: string;
    email: string;
    name?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateProductOfferingData {
  listingId: string;
  productName: string;
  description?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  availableUntil?: string;
  category?: string;
  usageInstructions?: string;
  photos?: string[];
  openingHours?: string;
}

interface ApproveProductOfferingData {
  offeringId: string;
  approved: boolean;
  rejectionReason?: string;
}

export const useProductOfferings = (listingId?: string) => {
  return useQuery({
    queryKey: ['productOfferings', listingId],
    queryFn: () => payloadClient.getProductOfferings(listingId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateProductOffering = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offeringData: CreateProductOfferingData) =>
      payloadClient.createProductOffering(offeringData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productOfferings'] });
    },
  });
};

export const useUpdateProductOffering = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      offeringId,
      updates,
    }: {
      offeringId: string;
      updates: {
        quantity?: number;
        status?: 'available' | 'out_of_stock' | 'reserved';
        description?: string;
      };
    }) => payloadClient.updateProductOffering(offeringId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productOfferings'] });
    },
  });
};

export const useDeleteProductOffering = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offeringId: string) => payloadClient.deleteProductOffering(offeringId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productOfferings'] });
    },
  });
};

export const useProductFavorites = () => {
  return useQuery({
    queryKey: ['productFavorites'],
    queryFn: () => payloadClient.getProductFavorites(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useToggleProductFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offeringId: string) => payloadClient.toggleProductFavorite(offeringId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productFavorites'] });
    },
  });
};

export const useReportOutOfStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ offeringId, reporterNote }: { offeringId: string; reporterNote?: string }) =>
      payloadClient.reportOutOfStock(offeringId, reporterNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productOfferings'] });
    },
  });
};

export const useCreateToolReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservationData: {
      toolId: string;
      startDate: string;
      duration: number;
      notes?: string;
    }) => payloadClient.createToolReservation(reservationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toolReservations'] });
    },
  });
};

export const useApproveProductOffering = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApproveProductOfferingData) =>
      payloadClient.approveProductOffering(data.offeringId, data.approved, data.rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productOfferings'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
    },
  });
};

export const usePendingApprovalsCount = () => {
  return useQuery({
    queryKey: ['pendingApprovalsCount'],
    queryFn: async () => {
      const baseUrl = payloadClient.getBaseUrl();
      const currentUser = payloadClient.getUser();

      if (!baseUrl || !currentUser?.id) {
        return 0;
      }

      // Get all listings owned by user
      const userListingsResponse = await fetch(
        `${baseUrl}/api/listings?createdBy=${currentUser.id}`,
        {
          headers: payloadClient.getAuthHeaders(),
        }
      );

      if (!userListingsResponse.ok) {
        return 0;
      }

      const userListingsData = await userListingsResponse.json();
      const userListings = userListingsData.docs || [];

      // Count pending approvals across all user's listings
      let totalPending = 0;
      for (const listing of userListings) {
        if (
          ['food', 'hygiene', 'community', 'farm'].includes(listing.category)
        ) {
          const pending = await payloadClient.getPendingProductOfferings(listing.id);
          totalPending += pending.length;
        }
      }

      return totalPending;
    },
    enabled: !!payloadClient.getUser()?.id,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useUserPendingApprovals = () => {
  return useQuery({
    queryKey: ['userPendingApprovals'],
    queryFn: async () => {
      const baseUrl = payloadClient.getBaseUrl();
      const currentUser = payloadClient.getUser();

      if (!baseUrl || !currentUser?.id) {
        return [];
      }

      // Get all listings owned by user
      const userListingsResponse = await fetch(
        `${baseUrl}/api/listings?createdBy=${currentUser.id}`,
        {
          headers: payloadClient.getAuthHeaders(),
        }
      );

      if (!userListingsResponse.ok) {
        return [];
      }

      const userListingsData = await userListingsResponse.json();
      const userListings = userListingsData.docs || [];

      // Get pending approvals for each listing
      const allPending: any[] = [];
      for (const listing of userListings) {
        if (
          ['food', 'hygiene', 'community', 'farm'].includes(listing.category)
        ) {
          const pending = await payloadClient.getPendingProductOfferings(listing.id);
          allPending.push(
            ...pending.map((item: any) => ({
              ...item,
              listingName: listing.name,
              listingId: listing.id,
            }))
          );
        }
      }

      return allPending;
    },
    enabled: !!payloadClient.getUser()?.id,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export type { ProductOffering, CreateProductOfferingData };
