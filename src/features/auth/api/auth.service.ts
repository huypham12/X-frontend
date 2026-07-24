import { apiClient } from '@/services/api.client';

export const authService = {
  login: async (data: any) => {
    const res = await apiClient.post('/auth/login', data);
    return res.data;
  },
  register: async (data: any) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },
  verifyEmail: async (data: { email_verify_token: string }) => {
    const res = await apiClient.post('/auth/verify-email', data);
    return res.data;
  },
  forgotPassword: async (data: { email: string }) => {
    const res = await apiClient.post('/auth/forgot-password', data);
    return res.data;
  },
  verifyForgotPasswordToken: async (data: { forgot_password_token: string }) => {
    const res = await apiClient.post('/auth/verify-forgot-password', data);
    return res.data;
  },
  resetPassword: async (data: any) => {
    const res = await apiClient.post('/auth/reset-password', data);
    return res.data;
  },
  changePassword: async (data: any) => {
    const res = await apiClient.patch('/auth/change-password', data);
    return res.data;
  },
  resendVerifyEmail: async () => {
    const res = await apiClient.post('/auth/resend-verify-email');
    return res.data;
  },
  logout: async (data: { refresh_token: string }) => {
    const res = await apiClient.post('/auth/logout', data);
    return res.data;
  },
};
