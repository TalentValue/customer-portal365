export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT'

export type TicketStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'WAITING_FOR_CLIENT'
  | 'SUBMITTED'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CLOSED'
  | 'OVERDUE'

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type TicketType =
  | 'REQUIREMENT_REQUEST'
  | 'FILE_COLLECTION'
  | 'APPROVAL_REQUEST'
  | 'BUG_REPORT'
  | 'SUPPORT_REQUEST'
  | 'GENERAL_TASK'
  | 'FOLLOW_UP'

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  companyId?: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
  avatarUrl?: string
}

export interface Company {
  id: string
  name: string
  logo?: string
  industry?: string
  timezone?: string
  website?: string
  status: 'ACTIVE' | 'ARCHIVED' | 'INACTIVE'
  onboardingStage?: string
  billingStatus?: string
  notes?: string
  tags: string[]
  accountManagerId?: string
  accountManager?: User
  createdAt: string
  _count?: { tickets: number; contacts: number }
  completionPercentage?: number
}

export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  designation?: string
  companyId: string
  company?: Company
  userId?: string
  inviteStatus: InviteStatus
  isActive: boolean
  lastLogin?: string
  createdAt: string
}

export interface Ticket {
  id: string
  title: string
  description?: string
  type: TicketType
  status: TicketStatus
  priority: TicketPriority
  companyId: string
  company?: Company
  assigneeId?: string
  assignee?: User
  teamId?: string
  team?: { id: string; name: string }
  clientContactId?: string
  clientContact?: Contact
  dueDate?: string
  slaDeadline?: string
  tags: string[]
  isArchived: boolean
  archivedAt?: string
  isRecurring: boolean
  recurrencePattern?: string
  recurrenceEndDate?: string
  parentTicketId?: string
  templateId?: string
  createdAt: string
  updatedAt: string
  _count?: { comments: number; attachments: number }
  watchers?: any[]
}

export interface TicketComment {
  id: string
  ticketId: string
  author: User
  body: string
  isInternal: boolean
  createdAt: string
  updatedAt: string
}

export interface TicketAttachment {
  id: string
  ticketId: string
  uploadedBy: User
  fileUrl: string
  fileName: string
  fileType: string
  fileSize: number
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body: string
  isRead: boolean
  relatedId?: string
  relatedType?: string
  createdAt: string
}

export interface ActivityLog {
  id: string
  userId: string
  user?: User
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

export interface DashboardStats {
  totalCompanies: number
  activeTickets: number
  overdueTickets: number
  pendingApprovals: number
  completionRate: number
  recentActivity: ActivityLog[]
}
