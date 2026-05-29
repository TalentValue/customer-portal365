import api from './api'
import { Notification, PaginatedResponse } from '@/types'

export const notificationsService = {
  list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { params }),

  markRead: (id: string) => api.patch(`/notifications/${id}/read`),

  markAllRead: () => api.patch('/notifications/read-all'),

  delete: (id: string) => api.delete(`/notifications/${id}`),

  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
}
