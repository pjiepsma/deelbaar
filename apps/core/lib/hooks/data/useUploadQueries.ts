import NetInfo from '@react-native-community/netinfo';
import { useMutation, useQuery } from '@tanstack/react-query';

import { payloadClient } from '../../api/PayloadClient';
import { fileQueueManager } from '../../storage/FileQueueManager';

export function useUploadFile() {
  return useMutation({
    mutationFn: async ({
      file,
      alt,
      relatedCollection,
      relatedId,
    }: {
      file: { uri: string; type: string; name: string };
      alt?: string;
      relatedCollection?: string;
      relatedId?: string;
    }) => {
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected) {
        const fileId = await fileQueueManager.queueFile({
          uri: file.uri,
          type: file.type,
          name: file.name,
          alt,
          relatedCollection,
          relatedId,
        });

        return {
          id: fileId,
          url: file.uri,
          _queued: true,
        };
      }

      const { data, error } = await payloadClient.uploadFile(file, alt);
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useQueuedFiles() {
  return useQuery({
    queryKey: ['queuedFiles'],
    queryFn: async () => {
      const queue = fileQueueManager.getQueue();
      return {
        count: queue.length,
        files: queue,
      };
    },
    refetchInterval: 5000,
  });
}
