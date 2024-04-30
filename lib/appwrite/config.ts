import { Account, Client, Databases, Storage, Avatars } from "appwrite";

export const appwriteConfig: { [key: string]: string } = {
  url: process.env.EXPO_PUBLIC_APPWRITE_API as string,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID as string,
};

export const client = new Client();
client.setEndpoint(appwriteConfig.url).setProject(appwriteConfig.projectId);
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);
