import { Account, Client, Databases, Storage, Avatars } from "appwrite";

export const appwriteConfig = {
  url: process.env.EXPO_PUBLIC_APPWRITE_API,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  storageId: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_ID,
  userCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID,
  favoritesCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_FAVORITES_COLLECTION_ID,
  listingsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_LISTINGS_COLLECTION_ID,
};

export const client = new Client();
client
  .setEndpoint(appwriteConfig.url as string)
  .setProject(appwriteConfig.projectId as string);
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);
