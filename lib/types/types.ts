import { Omit } from 'react-native';
import { PictureRecord } from './models';

// Custom attachment record (replaces PowerSync)
export interface AttachmentRecord {
  id: string;
  filename: string;
  media_type?: string;
  state?: number;
  timestamp?: number;
  local_uri?: string;
  size?: number;
}

export interface StoreEntry {
  lat: number;
  long: number;
  name: string;
  description: string;
  image?: File;
}

export interface StoreResult {
  id: number;
  lat: number;
  long: number;
  name: string;
  description: string;
  image?: any;
  dist_meters?: number;
}

export type PictureEntry = PictureRecord &
  Partial<Omit<AttachmentRecord, 'id'>> & { picture_id: string; attachment_id: string | null }; // TODO
