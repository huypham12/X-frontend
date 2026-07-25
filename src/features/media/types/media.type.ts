export type MediaType = 'image' | 'video' | 'audio';
export type UploadStatus = 'uploading' | 'success' | 'error';

export interface MediaItem {
  id: string; // Temporary ID for frontend state management
  url: string; // Local Object URL for preview, or backend URL when success
  type: MediaType;
  status: UploadStatus;
  progress: number; // 0 to 100
  file?: File; // Reference to the original file
  backendId?: string; // The media_id returned from backend
}

export interface MediaResponse {
  statusCode: number;
  message: string;
  data?: any[];
  result?: any[];
}
