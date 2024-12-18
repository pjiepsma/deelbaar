import { AttachmentTable } from '@powersync/attachments';
import { Column, ColumnType, Index, IndexedColumn, Schema, Table } from '@powersync/react-native';

export const PICTURE_TABLE = 'pictures';
export const REVIEW_TABLE = 'reviews';
export const LISTING_TABLE = 'listings';
export const FAVORITES_TABLE = 'favorites';
export const PROFILES_TABLE = 'profiles';

export interface ListingRecord {
  id: string;
  name: string;
  description: string;
  lat: number;
  long: number;
  distance: string;
  rating?: string;
  picture: PictureRecord | null;
}

export interface PictureRecord {
  id: string;
  created_at: string;
  created_by: string;
  listing_id: string;
  photo_id: string;
  review_id: string;
}

export interface ReviewRecord {
  id: string;
  rating: number;
  description: string;
  created_at: string;
  created_by: string;
  listing_id: string;
}

export interface ProfileRecord {
  id: string;
  updated_at: string;
  username: string;
  name: string;
  avatar: string;
  surname: string;
  role: string;
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
    name: 'profiles',
    columns: [
      new Column({ name: 'updated_at', type: ColumnType.TEXT }),
      new Column({ name: 'username', type: ColumnType.TEXT }),
      new Column({ name: 'name', type: ColumnType.TEXT }),
      new Column({ name: 'avatar', type: ColumnType.TEXT }),
      new Column({ name: 'surname', type: ColumnType.TEXT }),
      new Column({ name: 'role', type: ColumnType.TEXT }),
    ],
  }),
  new Table({
    name: 'pictures',
    columns: [
      new Column({ name: 'created_at', type: ColumnType.TEXT }),
      new Column({ name: 'created_by', type: ColumnType.TEXT }),
      new Column({ name: 'listing_id', type: ColumnType.TEXT }),
      new Column({ name: 'photo_id', type: ColumnType.TEXT }),
      new Column({ name: 'review_id', type: ColumnType.TEXT }),
    ],
    indexes: [
      new Index({
        name: 'listing',
        columns: [new IndexedColumn({ name: 'listing_id' })],
      }),
    ],
  }),
  new Table({
    name: 'reviews',
    columns: [
      new Column({ name: 'rating', type: ColumnType.INTEGER }),
      new Column({ name: 'description', type: ColumnType.TEXT }),
      new Column({ name: 'created_at', type: ColumnType.TEXT }),
      new Column({ name: 'created_by', type: ColumnType.TEXT }),
      new Column({ name: 'listing_id', type: ColumnType.TEXT }),
    ],
    indexes: [
      new Index({
        name: 'listing',
        columns: [new IndexedColumn({ name: 'listing_id' })],
      }),
    ],
  }),
  new Table({
    name: 'favorites',
    columns: [
      new Column({ name: 'rating', type: ColumnType.INTEGER }),
      new Column({ name: 'description', type: ColumnType.TEXT }),
      new Column({ name: 'created_at', type: ColumnType.TEXT }),
      new Column({ name: 'created_by', type: ColumnType.TEXT }),
      new Column({ name: 'listing_id', type: ColumnType.TEXT }),
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
