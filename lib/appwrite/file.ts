// ============================== GET FILE URL
import { appwriteConfig, storage } from "@/lib/appwrite/config";
import { ID } from "react-native-appwrite";
// import { ImageGravity } from "appwrite/src/enums/image-gravity";
export const EXPO_PUBLIC_APPWRITE_STORAGE_ID = "66254e3d0ca08a1aadd6";

// ============================== UPLOAD FILE
export async function uploadFile(file: {
  name: string;
  type: string;
  size: number;
  uri: string;
}) {
  try {
    return await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      file,
    );
  } catch (error) {
    console.log(error);
  }
}

export function getFilePreview(fileId: string) {
  try {
    const fileUrl = storage.getFilePreview(
      appwriteConfig.storageId,
      fileId,
      2000,
      2000,
      "Top",
      100,
    );

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    console.log(error);
  }
}

// ============================== DELETE FILE
export async function deleteFile(fileId: string) {
  try {
    await storage.deleteFile(appwriteConfig.storageId, fileId);

    return { status: "ok" };
  } catch (error) {
    console.log(error);
  }
}
