import api from './api'
import { User } from '@/types'

export const authService = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; user: User }>('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  refresh: () => api.post<{ accessToken: string }>('/auth/refresh'),

  me: () => api.get<User>('/auth/me'),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  acceptInvite: (token: string, password: string, firstName: string, lastName: string) =>
    api.post('/auth/accept-invite', { token, password, firstName, lastName }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),

  updateProfile: (firstName: string, lastName: string) =>
    api.put<{ firstName: string; lastName: string }>('/auth/profile', { firstName, lastName }),

  getNotificationPreferences: () =>
    api.get<Record<string, boolean>>('/auth/notification-preferences'),

  updateNotificationPreferences: (prefs: Record<string, boolean>) =>
    api.put<Record<string, boolean>>('/auth/notification-preferences', prefs),
}
