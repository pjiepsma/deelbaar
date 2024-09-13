export interface StoreEntry {
  lat?: number;
  long?: number;
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
