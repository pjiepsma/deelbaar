import { AttachmentTable } from '@powersync/attachments';
import { Column, ColumnType, Index, IndexedColumn, Schema, Table } from '@powersync/react-native';

export const PICTURE_TABLE = 'pictures';
export const LISTING_TABLE = 'listings';

export interface ListingRecord {
  id: string;
  name: string;
  description: string;
  created_at: string;
  owner_id?: string;
  location: string;
  dist_meters: string;
  lat: number;
  long: number;
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
      new Column({ name: 'name', type: ColumnType.TEXT }),
      new Column({ name: 'description', type: ColumnType.TEXT }),
      new Column({ name: 'created_at', type: ColumnType.TEXT }),
      new Column({ name: 'owner_id', type: ColumnType.TEXT }),
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
        name: 'picture',
        columns: [new IndexedColumn({ name: 'picture_id' })],
      }),
    ],
  }),
  // Add Attachment table
  new AttachmentTable(),
]);

export type Database = (typeof AppSchema)['types'];
// export type Todo = Database['todos'];
// export type Store = Database['stores'];
