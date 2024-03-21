import { Account, Client, ID } from "appwrite";

const client = new Client();
client
  .setEndpoint(process.env.EXPO_PUBLIC_API_URL as string)
  .setProject(process.env.EXPO_PUBLIC_API_KEY as string);

const account = new Account(client);

export const appwrite = {
  client,
  account: new Account(client),
  ID,
};
