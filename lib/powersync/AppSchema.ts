import { column, Schema, Table } from '@powersync/react-native';

export const TODOS_TABLE = 'todos';
export const STORES_TABLE = 'stores';

const todos = new Table({
  task: column.text,
  user_id: column.text,
  is_complete: column.integer,
});

const stores = new Table({
  id: column.text,
  name: column.text,
  description: column.text,
  location: column.text,
});

export const AppSchema = new Schema({
  todos,
  stores,
});

export type Database = (typeof AppSchema)['types'];

export type Todo = Database['todos'];
export type Store = Database['stores'];
