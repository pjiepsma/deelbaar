export type INavLink = {
  imgURL: string;
  route: string;
  label: string;
};

export type INewListing = {
  creator: string;
  owner: string;
  name: string;
  description: string;
  category: ICategory;
  files: File[];
  geometry: IGeometry;
  tags: ITags[];
};

export type IListing = {
  creator: string;
  owner: string;
  name: string;
  description: string;
  category: ICategory;
  images: [];
  geometry: IGeometry;
  tags: ITags[];
};

export type INewImage = {
  imageUrl: string;
  imageId: string;
};

export type IGeometry = {
  address: string;
  city: string;
  province: string;
  postal: string;
  latitude: number;
  longitude: number;
};

export enum ICategory {
  Books,
}

export enum ITags {
  Dutch,
  English,
}

export type IUpdatePost = {
  postId: string;
  caption: string;
  imageId: string;
  imageUrl: URL;
  file: File[];
  location?: string;
  tags?: string;
};

export type IUser = {
  id: string; // TODO
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  imageId: string;
  bio: string;
};

export type File = {
  name: string;
  type: string;
  size: number;
  uri: string;
};

export type IUpdateUser = {
  userId: string;
  name: string;
  bio: string;
  imageId: string;
  imageUrl: URL | string;
  file?: {
    name: string;
    type: string;
    size: number;
    uri: string;
  }; // File[]
};

export type INewUser = {
  name: string;
  email: string;
  username: string;
  password: string;
};
