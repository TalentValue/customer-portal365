import { PrismaClient } from '@prisma/client'
import { AppError } from '../middlewares/errorHandler'
import { notifyUser } from '../sockets'

const prisma = new PrismaClient()

export const notificationsService = {
  async list(userId: string, { page = 1, limit = 20, unreadOnly }: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const where: any = { userId }
    if (unreadOnly) where.isRead = false

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } })
  },

  async markRead(id: string, userId: string) {
    const n = await prisma.notification.findUnique({ where: { id } })
    if (!n || n.userId !== userId) throw new AppError('Not found', 404)
    return prisma.notification.update({ where: { id }, data: { isRead: true } })
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } })
  },

  async delete(id: string, userId: string) {
    const n = await prisma.notification.findUnique({ where: { id } })
    if (!n || n.userId !== userId) throw new AppError('Not found', 404)
    await prisma.notification.delete({ where: { id } })
  },

  async create(userId: string, data: { type: string; title: string; body: string; relatedId?: string; relatedType?: string }) {
    const notification = await prisma.notification.create({ data: { userId, ...data } })
    notifyUser(userId, 'notification:new', notification)
    return notification
  },

  async createBulk(userIds: string[], data: { type: string; title: string; body: string; relatedId?: string; relatedType?: string }) {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, ...data })),
    })
    // Emit to each user individually — createMany doesn't return rows
    userIds.forEach((userId) => notifyUser(userId, 'notification:new', { userId, ...data }))
  },
}
