export type MediaType = 'image' | 'video' | 'audio';
export type MediaStatus = 'pending' | 'ready' | 'failed';
export type MediaUploadStatus = 'uploading' | 'processing' | 'ready' | 'error';
export type MediaErrorCode =
  | 'upload_failed'
  | 'processing_failed'
  | 'processing_timeout';

export interface MediaItem {
  id: string;
  previewUrl: string;
  remoteUrl?: string;
  type: MediaType;
  status: MediaUploadStatus;
  progress: number;
  file: File;
  backendId?: string;
  errorCode?: MediaErrorCode;
}

export interface MediaMetadata {
  _id: string;
  url: string;
  thumbnail?: string;
  type: MediaType;
  status: MediaStatus;
}

export type MediaResponse = MediaMetadata[];
