import { AttachmentRecord } from '@powersync/attachments';
import { Omit } from 'react-native';

import { PictureRecord } from '~/lib/powersync/AppSchema';

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
