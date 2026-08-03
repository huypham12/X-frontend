import { apiClient } from '@/services/api.client';

interface ApiResponse<TData> {
  statusCode: number;
  message: string;
  data: TData;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  date_of_birth: string;
}

interface ResetPasswordPayload {
  forgot_password_token: string;
  password: string;
}

interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export const authService = {
  login: async (data: LoginPayload): Promise<AuthTokens> => {
    const res = await apiClient.post<ApiResponse<AuthTokens>>('/auth/login', data);
    return res.data.data;
  },
  register: async (data: RegisterPayload): Promise<unknown> => {
    const res = await apiClient.post<ApiResponse<unknown>>('/auth/register', data);
    return res.data.data;
  },
  verifyEmail: async (data: { email_verify_token: string }): Promise<unknown> => {
    const res = await apiClient.post<ApiResponse<unknown>>('/auth/verify-email', data);
    return res.data.data;
  },
  forgotPassword: async (data: { email: string }): Promise<unknown> => {
    const res = await apiClient.post<ApiResponse<unknown>>('/auth/forgot-password', data);
    return res.data.data;
  },
  verifyForgotPasswordToken: async (data: {
    forgot_password_token: string;
  }): Promise<unknown> => {
    const res = await apiClient.post<ApiResponse<unknown>>('/auth/verify-forgot-password', data);
    return res.data.data;
  },
  resetPassword: async (data: ResetPasswordPayload): Promise<unknown> => {
    const res = await apiClient.post<ApiResponse<unknown>>('/auth/reset-password', data);
    return res.data.data;
  },
  changePassword: async (data: ChangePasswordPayload): Promise<unknown> => {
    const res = await apiClient.patch<ApiResponse<unknown>>('/auth/change-password', data);
    return res.data.data;
  },
  resendVerifyEmail: async (): Promise<unknown> => {
    const res = await apiClient.post<ApiResponse<unknown>>('/auth/resend-verify-email');
    return res.data.data;
  },
  logout: async (data: { refresh_token: string }): Promise<unknown> => {
    const res = await apiClient.post<ApiResponse<unknown>>('/auth/logout', data);
    return res.data.data;
  },
};
