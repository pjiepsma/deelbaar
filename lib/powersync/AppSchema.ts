import { AttachmentTable } from '@powersync/attachments';
import { Column, ColumnType, Index, IndexedColumn, Schema, Table } from '@powersync/react-native';

import { PictureEntry } from '~/lib/types/types';

export const PICTURE_TABLE = 'pictures';
export const LISTING_TABLE = 'listings';

export interface ListingRecord {
  id: string;
  name: string;
  description: string;
  lat: number;
  long: number;
  dist_meters: string;
  picture: PictureEntry;
}

export interface PictureRecord {
  id: string;
  created_at: string;
  created_by: string;
  listing_id: string;
  photo_id: string;
}

export const AppSchema = new Schema([
  new Table({
    name: 'listings',
    columns: [
      new Column({ name: 'created_at', type: ColumnType.TEXT }),
      new Column({ name: 'name', type: ColumnType.TEXT }),
      new Column({ name: 'owner_id', type: ColumnType.TEXT }),
      new Column({ name: 'description', type: ColumnType.TEXT }),
      new Column({ name: 'location', type: ColumnType.TEXT }),
      new Column({ name: 'category', type: ColumnType.TEXT }),
      new Column({ name: 'tags', type: ColumnType.TEXT }),
    ],
  }),
  new Table({
    name: 'pictures',
    columns: [
      new Column({ name: 'created_at', type: ColumnType.TEXT }),
      new Column({ name: 'created_by', type: ColumnType.TEXT }),
      new Column({ name: 'listing_id', type: ColumnType.TEXT }),
      new Column({ name: 'photo_id', type: ColumnType.TEXT }),
    ],
    indexes: [
      new Index({
        name: 'listing',
        columns: [new IndexedColumn({ name: 'listing_id' })],
      }),
    ],
  }),
  // Add Attachment table
  new AttachmentTable(),
]);

export type Database = (typeof AppSchema)['types'];
// export type Todo = Database['todos'];
// export type Store = Database['stores'];
