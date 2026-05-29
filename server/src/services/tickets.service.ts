import { PrismaClient } from '@prisma/client'
import { AppError } from '../middlewares/errorHandler'
import { uploadFile } from '../utils/storage'
import { notificationsService } from './notifications.service'
import { notifyTicket } from '../sockets'

const prisma = new PrismaClient()

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT:               ['OPEN'],
  OPEN:                ['IN_PROGRESS', 'WAITING_FOR_CLIENT', 'OVERDUE', 'CLOSED'],
  IN_PROGRESS:         ['WAITING_FOR_CLIENT', 'SUBMITTED', 'COMPLETED', 'OVERDUE', 'CLOSED'],
  WAITING_FOR_CLIENT:  ['IN_PROGRESS', 'OVERDUE', 'CLOSED'],
  SUBMITTED:           ['APPROVED', 'REJECTED'],
  APPROVED:            ['COMPLETED'],
  REJECTED:            ['OPEN', 'CLOSED'],
  OVERDUE:             ['IN_PROGRESS', 'CLOSED'],
  COMPLETED:           ['CLOSED'],
  CLOSED:              [],
}

function extractMentionIds(html: string): string[] {
  const regex = /data-id="([^"]+)"/g
  const ids: string[] = []
  let match
  while ((match = regex.exec(html)) !== null) ids.push(match[1])
  return [...new Set(ids)]
}

export const ticketsService = {
  async list({ page = 1, limit = 20, search, status, priority, companyId, assigneeId, userId, role, archived = false }: {
    page?: number; limit?: number; search?: string; status?: string; priority?: string
    companyId?: string; assigneeId?: string; userId: string; role: string; archived?: boolean
  }) {
    const where: any = { isArchived: archived }
    if (search) where.title = { contains: search, mode: 'insensitive' }
    if (status) where.status = status
    if (priority) where.priority = priority
    if (companyId) where.companyId = companyId
    if (assigneeId) where.assigneeId = assigneeId
    if (role === 'CLIENT') {
      where.OR = [{ clientContactId: userId }, { watchers: { some: { userId } } }]
    }

    const [data, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          company: { select: { id: true, name: true, logo: true } },
          assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
          team: { select: { id: true, name: true } },
          clientContact: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { comments: true, attachments: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.ticket.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  },

  async get(id: string, userId: string, role: string, userCompanyId: string | null) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        company: true,
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        team: { select: { id: true, name: true } },
        clientContact: true,
        watchers: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        _count: { select: { comments: true, attachments: true } },
      },
    })
    if (!ticket) throw new AppError('Ticket not found', 404)
    if (role === 'CLIENT' && ticket.companyId !== userCompanyId) throw new AppError('Ticket not found', 404)
    return ticket
  },

  async create(data: any, userId: string) {
    if (!data.title) throw new AppError('Title is required', 400)
    if (!data.companyId) throw new AppError('Company is required', 400)

    // Populate defaults from template if provided
    let tplData: any = {}
    if (data.templateId) {
      const tpl = await prisma.ticketTemplate.findUnique({ where: { id: data.templateId } })
      if (tpl) tplData = { description: tpl.description, type: tpl.type, priority: tpl.priority, tags: tpl.tags }
    }

    const ticket = await prisma.ticket.create({
      data: {
        title: data.title,
        type: data.type ?? tplData.type ?? 'GENERAL_TASK',
        status: data.status ?? 'OPEN',
        priority: data.priority ?? tplData.priority ?? 'MEDIUM',
        companyId: data.companyId,
        description: data.description || tplData.description || undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        assigneeId: data.assigneeId || undefined,
        teamId: data.teamId || undefined,
        clientContactId: data.clientContactId || undefined,
        tags: data.tags ?? tplData.tags ?? [],
        templateId: data.templateId || undefined,
        isRecurring: data.isRecurring ?? false,
        recurrencePattern: data.recurrencePattern || undefined,
        recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : undefined,
      },
      include: { company: true },
    })
    await prisma.activityLog.create({
      data: { userId, action: 'TICKET_CREATED', entityType: 'Ticket', entityId: ticket.id },
    })
    return ticket
  },

  async update(id: string, data: any, userId: string, role = 'SUPER_ADMIN', userCompanyId?: string | null) {
    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) throw new AppError('Ticket not found', 404)
    if (role === 'ADMIN' && userCompanyId && ticket.companyId !== userCompanyId) {
      throw new AppError('Ticket not found', 404)
    }
    const { status: _status, ...safeData } = data
    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        ...safeData,
        dueDate: safeData.dueDate ? new Date(safeData.dueDate) : undefined,
        slaDeadline: safeData.slaDeadline ? new Date(safeData.slaDeadline) : undefined,
        recurrenceEndDate: safeData.recurrenceEndDate ? new Date(safeData.recurrenceEndDate) : undefined,
      },
    })
    await prisma.activityLog.create({
      data: { userId, action: 'TICKET_UPDATED', entityType: 'Ticket', entityId: id },
    })
    notifyTicket(id, 'ticket:updated', updated)
    return updated
  },

  async archive(id: string, userId: string, role = 'SUPER_ADMIN', userCompanyId?: string | null) {
    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) throw new AppError('Ticket not found', 404)
    if (role === 'ADMIN' && userCompanyId && ticket.companyId !== userCompanyId) {
      throw new AppError('Ticket not found', 404)
    }
    const isArchived = !ticket.isArchived
    const updated = await prisma.ticket.update({
      where: { id },
      data: { isArchived, archivedAt: isArchived ? new Date() : null },
    })
    await prisma.activityLog.create({
      data: { userId, action: isArchived ? 'TICKET_ARCHIVED' : 'TICKET_UNARCHIVED', entityType: 'Ticket', entityId: id },
    })
    notifyTicket(id, 'ticket:updated', { id, isArchived })
    return updated
  },

  async escalateToOverdue(id: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id }, include: { watchers: true } })
    if (!ticket) return
    if (ticket.status === 'OVERDUE') return

    await prisma.ticket.update({ where: { id }, data: { status: 'OVERDUE' } })

    const watcherIds = ticket.watchers.map((w) => w.userId)
    if (watcherIds.length) {
      await notificationsService.createBulk(watcherIds, {
        type: 'TICKET_OVERDUE',
        title: `Ticket overdue: ${ticket.title}`,
        body: `SLA deadline has been breached`,
        relatedId: id,
        relatedType: 'Ticket',
      })
    }

    await prisma.activityLog.create({
      data: { userId: null, action: 'STATUS_CHANGED_TO_OVERDUE', entityType: 'Ticket', entityId: id },
    })
    notifyTicket(id, 'ticket:updated', { id, status: 'OVERDUE' })
  },

  async delete(id: string, userId: string, role = 'SUPER_ADMIN', userCompanyId?: string | null) {
    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) throw new AppError('Ticket not found', 404)
    if (role === 'ADMIN' && userCompanyId && ticket.companyId !== userCompanyId) {
      throw new AppError('Ticket not found', 404)
    }
    await prisma.activityLog.create({
      data: { userId, action: 'TICKET_DELETED', entityType: 'Ticket', entityId: id },
    })
    await prisma.ticket.delete({ where: { id } })
  },

  async updateStatus(id: string, status: string, userId: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id }, include: { watchers: true } })
    if (!ticket) throw new AppError('Ticket not found', 404)

    const allowed = VALID_TRANSITIONS[ticket.status]
    if (!allowed) throw new AppError(`Unknown current status: ${ticket.status}`, 400)
    if (!allowed.includes(status)) {
      throw new AppError(`Cannot transition from ${ticket.status} to ${status}`, 400)
    }

    const updated = await prisma.ticket.update({ where: { id }, data: { status: status as any } })

    const watcherIds = ticket.watchers.map((w) => w.userId).filter((uid) => uid !== userId)
    if (watcherIds.length) {
      await notificationsService.createBulk(watcherIds, {
        type: 'TICKET_STATUS',
        title: `Ticket status changed: ${ticket.title}`,
        body: `Status changed to ${status.replace(/_/g, ' ')}`,
        relatedId: id,
        relatedType: 'Ticket',
      })
    }

    await prisma.activityLog.create({
      data: { userId, action: `STATUS_CHANGED_TO_${status}`, entityType: 'Ticket', entityId: id },
    })
    notifyTicket(id, 'ticket:updated', { id, status })
    return updated
  },

  async getComments(ticketId: string, userId: string, role: string) {
    const where: any = { ticketId }
    if (role === 'CLIENT') where.isInternal = false
    return prisma.ticketComment.findMany({
      where,
      include: { author: { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
    })
  },

  async addComment(ticketId: string, body: string, isInternal: boolean, authorId: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { watchers: true } })
    if (!ticket) throw new AppError('Ticket not found', 404)

    const comment = await prisma.ticketComment.create({
      data: { ticketId, body, isInternal, authorId },
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    })

    const plainBody = body.replace(/<[^>]+>/g, '').slice(0, 100)

    if (!isInternal) {
      const notifyIds = ticket.watchers.map((w) => w.userId).filter((id) => id !== authorId)
      if (notifyIds.length) {
        await notificationsService.createBulk(notifyIds, {
          type: 'NEW_COMMENT',
          title: `New comment on: ${ticket.title}`,
          body: plainBody,
          relatedId: ticketId,
          relatedType: 'Ticket',
        })
      }
    }

    // Notify @mentioned users
    const mentionedIds = extractMentionIds(body).filter((id) => id !== authorId)
    if (mentionedIds.length) {
      await notificationsService.createBulk(mentionedIds, {
        type: 'MENTION',
        title: `You were mentioned in: ${ticket.title}`,
        body: plainBody,
        relatedId: ticketId,
        relatedType: 'Ticket',
      })
    }

    notifyTicket(ticketId, 'comment:new', comment)
    return comment
  },

  async deleteComment(ticketId: string, commentId: string, userId: string, role: string) {
    const comment = await prisma.ticketComment.findUnique({ where: { id: commentId } })
    if (!comment) throw new AppError('Comment not found', 404)
    if (comment.authorId !== userId && role === 'CLIENT') throw new AppError('Not authorized', 403)
    await prisma.ticketComment.delete({ where: { id: commentId } })
  },

  async getAttachments(ticketId: string) {
    return prisma.ticketAttachment.findMany({
      where: { ticketId },
      include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    })
  },

  async uploadAttachment(ticketId: string, file: Express.Multer.File, userId: string) {
    const fileUrl = await uploadFile(file.buffer, file.originalname, file.mimetype, `tickets/${ticketId}`)
    return prisma.ticketAttachment.create({
      data: {
        ticketId,
        uploadedById: userId,
        fileUrl,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
      },
      include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
    })
  },

  async deleteAttachment(ticketId: string, attachmentId: string, userId: string, role: string) {
    const attachment = await prisma.ticketAttachment.findUnique({ where: { id: attachmentId } })
    if (!attachment) throw new AppError('Attachment not found', 404)
    if (role === 'CLIENT' && attachment.uploadedById !== userId) throw new AppError('Not authorized', 403)
    await prisma.ticketAttachment.delete({ where: { id: attachmentId } })
  },

  async toggleWatch(ticketId: string, userId: string) {
    const existing = await prisma.ticketWatcher.findUnique({
      where: { ticketId_userId: { ticketId, userId } },
    })
    if (existing) {
      await prisma.ticketWatcher.delete({ where: { ticketId_userId: { ticketId, userId } } })
      return { watching: false }
    }
    await prisma.ticketWatcher.create({ data: { ticketId, userId } })
    return { watching: true }
  },

  async getActivity(id: string, limit = 50) {
    return prisma.activityLog.findMany({
      where: { entityType: 'Ticket', entityId: id },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    })
  },
}
