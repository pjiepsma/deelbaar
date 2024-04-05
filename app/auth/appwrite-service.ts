import { Account, Client, ID } from "appwrite";

const client = new Client();
client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_API as string)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID as string);

export const appwrite = {
  client,
  account: new Account(client),
  ID,
};
