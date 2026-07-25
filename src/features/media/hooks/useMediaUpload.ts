import { useState, useCallback } from 'react';
import { MediaItem, MediaType, MediaResponse } from '../types/media.type';
import { mediaService } from '../api/media.service';

interface UseMediaUploadProps {
  maxFiles?: number;
  onMaxFilesError?: () => void;
}

export const useMediaUpload = ({ maxFiles = 4, onMaxFilesError }: UseMediaUploadProps = {}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  const isUploading = mediaItems.some((item) => item.status === 'uploading');

  const uploadFile = async (item: MediaItem) => {
    if (!item.file) return;

    try {
      let res: MediaResponse;

      const options = {
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setMediaItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, progress } : i))
            );
          }
        },
      };

      if (item.type === 'image') {
        res = await mediaService.uploadImage(item.file, options);
      } else if (item.type === 'video') {
        res = await mediaService.uploadVideo(item.file, options);
      } else {
        res = await mediaService.uploadAudio(item.file, options);
      }

      // Backend returns either 'data' or 'result' array depending on the exact DTO
      const mediaArray: any[] = (res as any).data || (res as any).result || [];
      const uploadedMedia = mediaArray[0];

      setMediaItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'success',
                progress: 100,
                backendId: uploadedMedia._id,
                url: uploadedMedia.url, // Override with backend URL
              }
            : i
        )
      );
    } catch (error) {
      setMediaItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'error', progress: 0 } : i))
      );
    }
  };

  const handleSelectFiles = useCallback(
    (files: FileList | File[]) => {
      const newFiles = Array.from(files);

      if (mediaItems.length + newFiles.length > maxFiles) {
        onMaxFilesError?.();
        return;
      }

      const newMediaItems: MediaItem[] = newFiles.map((file) => {
        const id = Math.random().toString(36).substring(2, 9);
        const type: MediaType = file.type.startsWith('video/')
          ? 'video'
          : file.type.startsWith('audio/')
          ? 'audio'
          : 'image';

        return {
          id,
          url: URL.createObjectURL(file), // create temporary preview
          type,
          status: 'uploading',
          progress: 0,
          file,
        };
      });

      setMediaItems((prev) => [...prev, ...newMediaItems]);

      // Start uploading immediately
      newMediaItems.forEach((item) => {
        uploadFile(item);
      });
    },
    [mediaItems, maxFiles, onMaxFilesError]
  );

  const handleRemoveMedia = useCallback((id: string) => {
    setMediaItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      // Revoke object URL to prevent memory leaks
      const removedItem = prev.find((item) => item.id === id);
      if (removedItem && removedItem.url.startsWith('blob:')) {
        URL.revokeObjectURL(removedItem.url);
      }
      return updated;
    });
  }, []);

  const clearMedia = useCallback(() => {
    mediaItems.forEach((item) => {
      if (item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
    });
    setMediaItems([]);
  }, [mediaItems]);

  return {
    mediaItems,
    isUploading,
    handleSelectFiles,
    handleRemoveMedia,
    clearMedia,
  };
};
