import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { payloadClient } from '~/lib/api/PayloadClient';
import type { CreateStripePaymentParams, StripeConnectResponse, StripeStatusResponse } from '~/lib/types/stripe';

const STRIPE_STATUS_QUERY_KEY = ['stripeAccountStatus'];

export const useStripeAccountStatus = () => {
  return useQuery({
    queryKey: STRIPE_STATUS_QUERY_KEY,
    queryFn: async (): Promise<StripeStatusResponse> => {
      const { data, error } = await payloadClient.getStripeAccountStatus();
      if (error) {
        throw error;
      }
      if (!data) {
        throw new Error('Stripe status response was empty');
      }
      return data;
    },
    enabled: payloadClient.isAuthenticated(),
    staleTime: 30 * 1000,
  });
};

export const useCreateStripeAccountSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<StripeConnectResponse> => {
      const { data, error } = await payloadClient.createStripeAccountSession();
      if (error) {
        throw error;
      }
      if (!data) {
        throw new Error('Stripe connect response was empty');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STRIPE_STATUS_QUERY_KEY });
    },
  });
};

export const useDisconnectStripeAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const { error } = await payloadClient.disconnectStripeAccount();
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STRIPE_STATUS_QUERY_KEY });
    },
  });
};

export const useCreateStripePaymentIntent = () => {
  return useMutation({
    mutationFn: async (params: CreateStripePaymentParams) => {
      const { data, error } = await payloadClient.createStripePaymentIntent(params);
      if (error) {
        throw error;
      }
      return data;
    },
  });
};







