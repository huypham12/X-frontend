import { apiClient } from '@/services/api.client';
import axios, { AxiosProgressEvent } from 'axios';
import Cookies from 'js-cookie';
import type { MediaMetadata, MediaResponse } from '../types/media.type';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface UploadOptions {
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  signal?: AbortSignal;
}

interface UploadMediaApiResponse {
  data: MediaResponse;
}

interface MediaApiResponse {
  data: MediaMetadata;
}

export const mediaService = {
  uploadImage: async (file: File, options?: UploadOptions) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = Cookies.get('access_token');
    const res = await axios.post<UploadMediaApiResponse>(`${API_URL}/media/upload-image`, formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      onUploadProgress: options?.onUploadProgress,
      signal: options?.signal,
    });
    return res.data.data;
  },

  uploadVideo: async (file: File, options?: UploadOptions) => {
    const formData = new FormData();
    formData.append('video', file);
    
    const token = Cookies.get('access_token');
    const res = await axios.post<UploadMediaApiResponse>(`${API_URL}/media/upload-video`, formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      onUploadProgress: options?.onUploadProgress,
      signal: options?.signal,
    });
    return res.data.data;
  },

  uploadAudio: async (file: File, options?: UploadOptions) => {
    const formData = new FormData();
    formData.append('audio', file);
    
    const token = Cookies.get('access_token');
    const res = await axios.post<UploadMediaApiResponse>(`${API_URL}/media/upload-audio`, formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      onUploadProgress: options?.onUploadProgress,
      signal: options?.signal,
    });
    return res.data.data;
  },

  deleteMedia: async (mediaId: string) => {
    const res = await apiClient.delete(`/media/${mediaId}`);
    return res.data.data;
  },

  getMedia: async (mediaId: string, signal?: AbortSignal) => {
    const res = await apiClient.get<MediaApiResponse>(`/media/${mediaId}`, { signal });
    return res.data.data;
  },
};
