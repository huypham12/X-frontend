import { useCallback, useEffect, useRef, useState } from 'react';
import type { AxiosProgressEvent } from 'axios';
import { mediaService } from '../api/media.service';
import type { MediaItem, MediaMetadata, MediaResponse, MediaType } from '../types/media.type';

const POLL_INTERVAL_MS = 2_000;
const MAX_PROCESSING_TIME_MS = 5 * 60 * 1_000;
const IMAGE_AUDIO_MAX_SIZE = 50 * 1024 * 1024;
const VIDEO_MAX_SIZE = 100 * 1024 * 1024;

interface UseMediaUploadProps {
  maxFiles?: number;
  onMaxFilesError?: () => void;
}

const wait = (milliseconds: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      signal.removeEventListener('abort', handleAbort);
      resolve();
    }, milliseconds);

    const handleAbort = () => {
      window.clearTimeout(timeoutId);
      reject(new DOMException('Media operation aborted', 'AbortError'));
    };

    signal.addEventListener('abort', handleAbort, { once: true });
  });

const getMediaType = (file: File): MediaType | null => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return null;
};

export const useMediaUpload = ({ maxFiles = 4, onMaxFilesError }: UseMediaUploadProps = {}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const objectUrlsRef = useRef(new Set<string>());
  const controllersRef = useRef(new Map<string, AbortController>());

  const revokeObjectUrl = useCallback((url: string) => {
    if (!url.startsWith('blob:')) return;
    URL.revokeObjectURL(url);
    objectUrlsRef.current.delete(url);
  }, []);

  const cancelOperation = useCallback((itemId: string) => {
    controllersRef.current.get(itemId)?.abort();
    controllersRef.current.delete(itemId);
  }, []);

  const markReady = useCallback(
    (itemId: string, media: MediaMetadata, localPreviewUrl: string) => {
      revokeObjectUrl(localPreviewUrl);
      setMediaItems((current) =>
        current.map((item) =>
          item.id === itemId
            ? {
                ...item,
                previewUrl: media.url,
                remoteUrl: media.url,
                backendId: media._id,
                status: 'ready',
                progress: 100,
                errorCode: undefined,
              }
            : item
        )
      );
      controllersRef.current.delete(itemId);
    },
    [revokeObjectUrl]
  );

  const pollMediaUntilSettled = useCallback(
    async (
      itemId: string,
      mediaId: string,
      localPreviewUrl: string,
      controller: AbortController,
      startedAt = Date.now()
    ) => {
      try {
        while (!controller.signal.aborted && Date.now() - startedAt < MAX_PROCESSING_TIME_MS) {
          await wait(POLL_INTERVAL_MS, controller.signal);

          let media: MediaMetadata;
          try {
            media = await mediaService.getMedia(mediaId, controller.signal);
          } catch {
            if (controller.signal.aborted) return;
            continue;
          }

          if (media.status === 'ready' && media.url) {
            markReady(itemId, media, localPreviewUrl);
            return;
          }

          if (media.status === 'failed') {
            setMediaItems((current) =>
              current.map((item) =>
                item.id === itemId
                  ? { ...item, status: 'error', errorCode: 'processing_failed' }
                  : item
              )
            );
            controllersRef.current.delete(itemId);
            return;
          }
        }

        if (!controller.signal.aborted) {
          setMediaItems((current) =>
            current.map((item) =>
              item.id === itemId
                ? { ...item, status: 'error', errorCode: 'processing_timeout' }
                : item
            )
          );
          controllersRef.current.delete(itemId);
        }
      } catch {
        if (!controller.signal.aborted) {
          setMediaItems((current) =>
            current.map((item) =>
              item.id === itemId
                ? { ...item, status: 'error', errorCode: 'processing_timeout' }
                : item
            )
          );
          controllersRef.current.delete(itemId);
        }
      }
    },
    [markReady]
  );

  const uploadFile = useCallback(
    async (item: MediaItem) => {
      cancelOperation(item.id);
      const controller = new AbortController();
      controllersRef.current.set(item.id, controller);

      try {
        let response: MediaResponse;
        const options = {
          signal: controller.signal,
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (!progressEvent.total) return;
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setMediaItems((current) =>
              current.map((currentItem) =>
                currentItem.id === item.id ? { ...currentItem, progress } : currentItem
              )
            );
          },
        };

        if (item.type === 'image') {
          response = await mediaService.uploadImage(item.file, options);
        } else if (item.type === 'video') {
          response = await mediaService.uploadVideo(item.file, options);
        } else {
          response = await mediaService.uploadAudio(item.file, options);
        }

        const uploadedMedia = response[0];
        if (!uploadedMedia?._id) {
          throw new Error('The upload response did not include a media ID.');
        }

        if (uploadedMedia.status === 'failed') {
          setMediaItems((current) =>
            current.map((currentItem) =>
              currentItem.id === item.id
                ? {
                    ...currentItem,
                    backendId: uploadedMedia._id,
                    status: 'error',
                    progress: 100,
                    errorCode: 'processing_failed',
                  }
                : currentItem
            )
          );
          controllersRef.current.delete(item.id);
          return;
        }

        if (uploadedMedia.status === 'ready' && uploadedMedia.url) {
          markReady(item.id, uploadedMedia, item.previewUrl);
          return;
        }

        setMediaItems((current) =>
          current.map((currentItem) =>
            currentItem.id === item.id
              ? {
                  ...currentItem,
                  backendId: uploadedMedia._id,
                  status: 'processing',
                  progress: 100,
                  errorCode: undefined,
                }
              : currentItem
          )
        );

        await pollMediaUntilSettled(
          item.id,
          uploadedMedia._id,
          item.previewUrl,
          controller
        );
      } catch {
        if (controller.signal.aborted) return;
        controllersRef.current.delete(item.id);
        setMediaItems((current) =>
          current.map((currentItem) =>
            currentItem.id === item.id
              ? { ...currentItem, status: 'error', progress: 0, errorCode: 'upload_failed' }
              : currentItem
          )
        );
      }
    },
    [cancelOperation, markReady, pollMediaUntilSettled]
  );

  const handleSelectFiles = useCallback(
    (files: FileList | File[]) => {
      const selectedFiles = Array.from(files);

      if (mediaItems.length + selectedFiles.length > maxFiles) {
        setErrorMessage(`You can attach up to ${maxFiles} media files.`);
        onMaxFilesError?.();
        return;
      }

      for (const file of selectedFiles) {
        const type = getMediaType(file);
        if (!type) {
          setErrorMessage(`${file.name} is not a supported media file.`);
          return;
        }

        const maxSize = type === 'video' ? VIDEO_MAX_SIZE : IMAGE_AUDIO_MAX_SIZE;
        if (file.size > maxSize) {
          const maxSizeInMb = type === 'video' ? 100 : 50;
          setErrorMessage(`${file.name} exceeds the ${maxSizeInMb} MB limit.`);
          return;
        }
      }

      setErrorMessage(null);
      const newMediaItems: MediaItem[] = selectedFiles.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        objectUrlsRef.current.add(previewUrl);

        return {
          id: crypto.randomUUID(),
          previewUrl,
          type: getMediaType(file) as MediaType,
          status: 'uploading',
          progress: 0,
          file,
        };
      });

      setMediaItems((current) => [...current, ...newMediaItems]);
      newMediaItems.forEach((item) => void uploadFile(item));
    },
    [maxFiles, mediaItems.length, onMaxFilesError, uploadFile]
  );

  const handleRemoveMedia = useCallback(
    (id: string) => {
      cancelOperation(id);
      setMediaItems((current) => {
        const removedItem = current.find((item) => item.id === id);
        if (removedItem) revokeObjectUrl(removedItem.previewUrl);
        return current.filter((item) => item.id !== id);
      });
    },
    [cancelOperation, revokeObjectUrl]
  );

  const retryUpload = useCallback(
    (id: string) => {
      const item = mediaItems.find((currentItem) => currentItem.id === id);
      if (!item) return;

      const retryItem: MediaItem = {
        ...item,
        backendId: undefined,
        remoteUrl: undefined,
        status: 'uploading',
        progress: 0,
        errorCode: undefined,
      };
      setMediaItems((current) =>
        current.map((currentItem) => (currentItem.id === id ? retryItem : currentItem))
      );
      void uploadFile(retryItem);
    },
    [mediaItems, uploadFile]
  );

  const continueProcessing = useCallback(
    (id: string) => {
      const item = mediaItems.find((currentItem) => currentItem.id === id);
      if (!item?.backendId) return;

      cancelOperation(id);
      const controller = new AbortController();
      controllersRef.current.set(id, controller);
      setMediaItems((current) =>
        current.map((currentItem) =>
          currentItem.id === id
            ? { ...currentItem, status: 'processing', errorCode: undefined }
            : currentItem
        )
      );
      void pollMediaUntilSettled(id, item.backendId, item.previewUrl, controller);
    },
    [cancelOperation, mediaItems, pollMediaUntilSettled]
  );

  const clearMedia = useCallback(() => {
    controllersRef.current.forEach((controller) => controller.abort());
    controllersRef.current.clear();
    setMediaItems((current) => {
      current.forEach((item) => revokeObjectUrl(item.previewUrl));
      return [];
    });
    setErrorMessage(null);
  }, [revokeObjectUrl]);

  useEffect(() => {
    const objectUrls = objectUrlsRef.current;
    const controllers = controllersRef.current;

    return () => {
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.clear();
    };
  }, []);

  const isMediaBusy = mediaItems.some(
    (item) => item.status === 'uploading' || item.status === 'processing'
  );
  const hasMediaError = mediaItems.some((item) => item.status === 'error');
  const readyMediaIds = mediaItems.flatMap((item) =>
    item.status === 'ready' && item.backendId ? [item.backendId] : []
  );

  return {
    mediaItems,
    isMediaBusy,
    hasMediaError,
    readyMediaIds,
    errorMessage,
    handleSelectFiles,
    handleRemoveMedia,
    retryUpload,
    continueProcessing,
    clearMedia,
  };
};
