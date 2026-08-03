import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface RefreshTokenResponse {
  data: {
    access_token: string;
    refresh_token: string;
  };
}

interface RefreshAccessTokenRequest {
  refreshToken: string;
  promise: Promise<string>;
}

let refreshAccessTokenRequest: RefreshAccessTokenRequest | null = null;

export const refreshAccessToken = (): Promise<string> => {
  const requestRefreshToken = Cookies.get('refresh_token');
  if (!requestRefreshToken) return Promise.reject(new Error('No refresh token available'));
  if (refreshAccessTokenRequest?.refreshToken === requestRefreshToken) {
    return refreshAccessTokenRequest.promise;
  }

  const promise = (async () => {
    const response = await axios.post<RefreshTokenResponse>(`${API_URL}/auth/refresh-token`, {
      refresh_token: requestRefreshToken,
    });
    const { access_token, refresh_token } = response.data.data;

    if (Cookies.get('refresh_token') === requestRefreshToken) {
      Cookies.set('access_token', access_token, { expires: 1 });
      Cookies.set('refresh_token', refresh_token, { expires: 30 });
    }
    return access_token;
  })().finally(() => {
    if (refreshAccessTokenRequest?.promise === promise) refreshAccessTokenRequest = null;
  });

  refreshAccessTokenRequest = { refreshToken: requestRefreshToken, promise };
  return promise;
};

export const clearClientAuth = (): void => {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');
};

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Check if error is 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const requestRefreshToken = Cookies.get('refresh_token');
      try {
        const access_token = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        const isCurrentSession = Cookies.get('refresh_token') === requestRefreshToken;
        if (isCurrentSession) {
          clearClientAuth();
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-storage');
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
