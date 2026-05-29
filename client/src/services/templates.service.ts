import api from './api'

export interface TicketTemplate {
  id: string
  name: string
  title: string
  description?: string
  type: string
  priority: string
  tags: string[]
  createdById: string
  createdBy?: { id: string; firstName: string; lastName: string }
  createdAt: string
  updatedAt: string
}

export const templatesService = {
  list: () => api.get<TicketTemplate[]>('/templates'),
  get: (id: string) => api.get<TicketTemplate>(`/templates/${id}`),
  create: (data: Partial<TicketTemplate>) => api.post<TicketTemplate>('/templates', data),
  update: (id: string, data: Partial<TicketTemplate>) => api.put<TicketTemplate>(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
}
