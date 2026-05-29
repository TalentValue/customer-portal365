import api from './api'
import { Company, PaginatedResponse } from '@/types'

export const companiesService = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortDir?: string }) =>
    api.get<PaginatedResponse<Company>>('/companies', { params }),

  get: (id: string) => api.get<Company>(`/companies/${id}`),

  create: (data: Partial<Company>) => api.post<Company>('/companies', data),

  update: (id: string, data: Partial<Company>) => api.put<Company>(`/companies/${id}`, data),

  delete: (id: string) => api.delete(`/companies/${id}`),

  archive: (id: string) => api.patch(`/companies/${id}/archive`),

  uploadLogo: (id: string, file: File) => {
    const form = new FormData()
    form.append('logo', file)
    return api.post<{ logoUrl: string }>(`/companies/${id}/logo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getActivity: (id: string, limit = 30) =>
    api.get(`/companies/${id}/activity`, { params: { limit } }),

  getUploads: (id: string, limit = 20) =>
    api.get(`/companies/${id}/uploads`, { params: { limit } }),

  getNotifications: (id: string, limit = 30) =>
    api.get(`/companies/${id}/notifications`, { params: { limit } }),
}
