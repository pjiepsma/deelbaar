export interface StripeAccountStatus {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsDue: string[];
}

export interface StripeConnectResponse {
  clientSecret: string;
  accountId: string;
  status: StripeAccountStatus;
}

export interface StripeStatusResponse {
  connected: boolean;
  status: StripeAccountStatus | null;
}

export interface StripeDisconnectResponse {
  success: boolean;
}

export interface StripePaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
  status: string;
}

export interface CreateStripePaymentParams {
  amount: number;
  currency?: string;
  applicationFeeAmount?: number;
  description?: string;
  metadata?: Record<string, string | number | boolean>;
  receiptEmail?: string;
}







