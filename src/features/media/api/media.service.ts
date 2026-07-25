import { apiClient } from '@/services/api.client';
import axios, { AxiosProgressEvent } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface UploadOptions {
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
}

export const mediaService = {
  uploadImage: async (file: File, options?: UploadOptions) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = Cookies.get('access_token');
    const res = await axios.post(`${API_URL}/media/upload-image`, formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      onUploadProgress: options?.onUploadProgress,
    });
    return res.data;
  },

  uploadVideo: async (file: File, options?: UploadOptions) => {
    const formData = new FormData();
    formData.append('video', file);
    
    const token = Cookies.get('access_token');
    const res = await axios.post(`${API_URL}/media/upload-video`, formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      onUploadProgress: options?.onUploadProgress,
    });
    return res.data;
  },

  uploadAudio: async (file: File, options?: UploadOptions) => {
    const formData = new FormData();
    formData.append('audio', file);
    
    const token = Cookies.get('access_token');
    const res = await axios.post(`${API_URL}/media/upload-audio`, formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      onUploadProgress: options?.onUploadProgress,
    });
    return res.data;
  },

  deleteMedia: async (mediaId: string) => {
    const res = await apiClient.delete(`/media/${mediaId}`);
    return res.data;
  },
};
