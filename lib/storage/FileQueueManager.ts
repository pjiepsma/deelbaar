import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { payloadClient } from '../api/PayloadClient';

export interface QueuedFile {
  id: string;
  uri: string;
  type: string;
  name: string;
  alt?: string;
  createdAt: number;
  retryCount: number;
  relatedCollection?: string; // e.g., 'reviews', 'listings'
  relatedId?: string; // temporary ID of the related record
  uploadedMediaId?: string; // Payload media ID after upload
}

const QUEUED_FILES_KEY = 'queued_files';
const LOCAL_FILES_DIR = `${FileSystem.documentDirectory}offline_uploads/`;

class FileQueueManager {
  private queue: QueuedFile[] = [];

  async init() {
    // Ensure local directory exists
    const dirInfo = await FileSystem.getInfoAsync(LOCAL_FILES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(LOCAL_FILES_DIR, { intermediates: true });
    }

    // Load queue from storage
    await this.loadQueue();
  }

  private async loadQueue() {
    try {
      const stored = await AsyncStorage.getItem(QUEUED_FILES_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load file queue:', error);
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUED_FILES_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save file queue:', error);
    }
  }

  /**
   * Queue a file for upload when online
   */
  async queueFile(params: {
    uri: string;
    type: string;
    name: string;
    alt?: string;
    relatedCollection?: string;
    relatedId?: string;
  }): Promise<string> {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Copy file to local storage to ensure it persists
    const localPath = `${LOCAL_FILES_DIR}${fileId}_${params.name}`;
    await FileSystem.copyAsync({
      from: params.uri,
      to: localPath,
    });

    const queuedFile: QueuedFile = {
      id: fileId,
      uri: localPath,
      type: params.type,
      name: params.name,
      alt: params.alt ?? 'Ingezonden foto',
      createdAt: Date.now(),
      retryCount: 0,
      relatedCollection: params.relatedCollection,
      relatedId: params.relatedId,
    };

    this.queue.push(queuedFile);
    await this.saveQueue();

    return fileId; // Return temp ID that can be referenced
  }

  /**
   * Process the file upload queue
   */
  async processQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    console.log(`Processing ${this.queue.length} queued files...`);

    const successfulUploads: string[] = [];

    for (const file of this.queue) {
      try {
        // Check if file still exists
        const fileInfo = await FileSystem.getInfoAsync(file.uri);
        if (!fileInfo.exists) {
          console.warn(`File not found: ${file.uri}, removing from queue`);
          successfulUploads.push(file.id);
          continue;
        }

        // Upload to Payload
        const uploadResult = await this.uploadFile(file);
        
      if (uploadResult.success && uploadResult.mediaId) {
        file.uploadedMediaId = uploadResult.mediaId;
        successfulUploads.push(file.id);

        // Delete local copy after successful upload
        await FileSystem.deleteAsync(file.uri, { idempotent: true });

        console.log(`✅ Uploaded: ${file.name} -> ${uploadResult.mediaId}`);
      } else {
        file.retryCount++;
      }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        file.retryCount++;
      }
    }

    const now = Date.now();
    this.queue = this.queue.filter((file) => {
      if (successfulUploads.includes(file.id)) {
        return false;
      }

      const ageHours = (now - file.createdAt) / (1000 * 60 * 60);
      if (file.retryCount > 5 && ageHours > 12) {
        console.error(`❌ Giving up on ${file.name} after ${file.retryCount} retries and ${ageHours.toFixed(1)} hours`);
        FileSystem.deleteAsync(file.uri, { idempotent: true }).catch((err) =>
          console.error(`Failed to delete ${file.uri}`, err)
        );
        return false;
      }

      return true;
    });
    await this.saveQueue();

    console.log(`✅ File queue processed. ${this.queue.length} remaining.`);
  }

  /**
   * Upload a single file to Payload
   */
  private async uploadFile(file: QueuedFile): Promise<{ success: boolean; mediaId?: string }> {
    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create FormData
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);

      if (file.alt) {
        formData.append('alt', file.alt);
      }

      const { data, error } = await payloadClient.uploadFile(
        {
          uri: file.uri,
          type: file.type,
          name: file.name,
        },
        file.alt
      );

      if (error) {
        console.error('Upload error:', error);
        return { success: false };
      }

      return { success: true, mediaId: data?.id };
    } catch (error) {
      console.error('Upload exception:', error);
      return { success: false };
    }
  }

  /**
   * Get the uploaded media ID for a queued file
   */
  getUploadedMediaId(fileId: string): string | null {
    const file = this.queue.find(f => f.id === fileId);
    return file?.uploadedMediaId || null;
  }

  /**
   * Get all queued files
   */
  getQueue(): QueuedFile[] {
    return [...this.queue];
  }

  /**
   * Get queued files for a specific record
   */
  getQueuedFilesForRecord(collection: string, recordId: string): QueuedFile[] {
    return this.queue.filter(
      f => f.relatedCollection === collection && f.relatedId === recordId
    );
  }

  /**
   * Clear all queued files
   */
  async clearQueue() {
    // Delete all local files
    for (const file of this.queue) {
      try {
        await FileSystem.deleteAsync(file.uri, { idempotent: true });
      } catch (error) {
        console.error(`Error deleting ${file.uri}:`, error);
      }
    }

    this.queue = [];
    await this.saveQueue();
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }
}

export const fileQueueManager = new FileQueueManager();



