import api from './api'
import { Ticket, TicketComment, TicketAttachment, PaginatedResponse } from '@/types'

export const ticketsService = {
  list: (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    priority?: string
    companyId?: string
    assigneeId?: string
  }) => api.get<PaginatedResponse<Ticket>>('/tickets', { params }),

  get: (id: string) => api.get<Ticket>(`/tickets/${id}`),

  create: (data: Partial<Ticket>) => api.post<Ticket>('/tickets', data),

  update: (id: string, data: Partial<Ticket>) => api.put<Ticket>(`/tickets/${id}`, data),

  delete: (id: string) => api.delete(`/tickets/${id}`),

  updateStatus: (id: string, status: string) =>
    api.patch<Ticket>(`/tickets/${id}/status`, { status }),

  addComment: (id: string, body: string, isInternal = false) =>
    api.post<TicketComment>(`/tickets/${id}/comments`, { body, isInternal }),

  getComments: (id: string) => api.get<TicketComment[]>(`/tickets/${id}/comments`),

  deleteComment: (ticketId: string, commentId: string) =>
    api.delete(`/tickets/${ticketId}/comments/${commentId}`),

  getAttachments: (id: string) => api.get<TicketAttachment[]>(`/tickets/${id}/attachments`),

  uploadAttachment: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<TicketAttachment>(`/tickets/${id}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deleteAttachment: (ticketId: string, attachmentId: string) =>
    api.delete(`/tickets/${ticketId}/attachments/${attachmentId}`),

  watch: (id: string) => api.post(`/tickets/${id}/watch`),

  unwatch: (id: string) => api.delete(`/tickets/${id}/watch`),

  getActivity: (id: string) => api.get(`/tickets/${id}/activity`),

  archive: (id: string) => api.patch(`/tickets/${id}/archive`),
}
