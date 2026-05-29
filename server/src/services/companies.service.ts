import { PrismaClient } from '@prisma/client'
import { AppError } from '../middlewares/errorHandler'
import { uploadFile } from '../utils/storage'

const prisma = new PrismaClient()

export const companiesService = {
  async list({ page = 1, limit = 20, search, status, sortBy = 'createdAt', sortDir = 'desc', userId, role }: {
    page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortDir?: string; userId: string; role: string
  }) {
    const where: any = {}
    if (search) where.name = { contains: search, mode: 'insensitive' }
    if (status) where.status = status
    if (role === 'ADMIN') where.accountManagerId = userId

    const allowedSort = ['name', 'createdAt', 'status']
    const orderField = allowedSort.includes(sortBy) ? sortBy : 'createdAt'
    const orderDir = sortDir === 'asc' ? 'asc' : 'desc'

    const [data, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: { accountManager: { select: { id: true, firstName: true, lastName: true } }, _count: { select: { tickets: true, contacts: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: orderDir },
      }),
      prisma.company.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  },

  async get(id: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        accountManager: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { tickets: true, contacts: true } },
      },
    })
    if (!company) throw new AppError('Company not found', 404)
    return company
  },

  async create(data: any) {
    return prisma.company.create({ data })
  },

  async update(id: string, data: any) {
    const company = await prisma.company.findUnique({ where: { id } })
    if (!company) throw new AppError('Company not found', 404)
    return prisma.company.update({ where: { id }, data })
  },

  async delete(id: string) {
    const company = await prisma.company.findUnique({ where: { id } })
    if (!company) throw new AppError('Company not found', 404)
    await prisma.company.delete({ where: { id } })
  },

  async archive(id: string) {
    return prisma.company.update({ where: { id }, data: { status: 'ARCHIVED' } })
  },

  async uploadLogo(id: string, buffer: Buffer, originalName: string, mimeType: string) {
    const logoUrl = await uploadFile(buffer, originalName, mimeType, 'logos')
    await prisma.company.update({ where: { id }, data: { logo: logoUrl } })
    return logoUrl
  },

  async getActivity(id: string, limit = 30) {
    // Collect IDs of all entities belonging to this company
    const [ticketIds, contactIds] = await Promise.all([
      prisma.ticket.findMany({ where: { companyId: id }, select: { id: true } }).then((r) => r.map((t) => t.id)),
      prisma.contact.findMany({ where: { companyId: id }, select: { id: true } }).then((r) => r.map((c) => c.id)),
    ])

    return prisma.activityLog.findMany({
      where: {
        OR: [
          { entityType: 'Company', entityId: id },
          { entityType: 'Ticket', entityId: { in: ticketIds } },
          { entityType: 'Contact', entityId: { in: contactIds } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    })
  },

  async getUploads(id: string, limit = 20) {
    const ticketIds = await prisma.ticket
      .findMany({ where: { companyId: id }, select: { id: true } })
      .then((r) => r.map((t) => t.id))

    return prisma.ticketAttachment.findMany({
      where: { ticketId: { in: ticketIds } },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        ticket: { select: { id: true, title: true } },
      },
    })
  },

  async getNotifications(id: string, limit = 30) {
    const ticketIds = await prisma.ticket
      .findMany({ where: { companyId: id }, select: { id: true } })
      .then((r) => r.map((t) => t.id))

    return prisma.notification.findMany({
      where: {
        OR: [
          { relatedType: 'Company', relatedId: id },
          { relatedType: 'Ticket', relatedId: { in: ticketIds } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    })
  },
}
