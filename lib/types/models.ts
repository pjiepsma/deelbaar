import type { Listing } from './payload-generated';

export type ListingRecord = Listing & {
  distance?: number;
};

export interface PictureRecord {
  id: string;
  photo: any; // Media or media ID
  created_by: any; // User or user ID
  listing?: any; // Listing or listing ID
  review?: any; // Review or review ID
  createdAt?: string;
}

export interface ReviewRecord {
  id: string;
  rating: number;
  description: string;
  created_by: any; // User or user ID
  listing: any; // Listing or listing ID
  createdAt?: string;
}

export interface ProfileRecord {
  id: string;
  username?: string;
  name?: string;
  surname?: string;
  avatar?: any; // Media or media ID
  role?: string;
  updatedAt?: string;
}

export interface FavoriteRecord {
  id: string;
  user: any; // User or user ID
  listing: any; // Listing or listing ID
  createdAt?: string;
}

export interface NotificationRecord {
  id: string;
  user: string | any;
  type: 'photo_request' | 'photo_approved' | 'photo_rejected' | 'review' | 'favorite' | 'claim_approved' | 'claim_rejected' | 'system';
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  actionUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Legacy PowerSync table names (for migration reference)
export const PICTURE_TABLE = 'pictures';
export const REVIEW_TABLE = 'reviews';
export const LISTING_TABLE = 'listings';
export const FAVORITES_TABLE = 'favorites';
export const PROFILES_TABLE = 'users';
export const TODO_TABLE = 'todos';

// Todo type (for legacy components)
export interface Todo {
  id: string;
  task: string;
  is_complete: boolean;
  user_id: string;
  modified_at?: string;
}





