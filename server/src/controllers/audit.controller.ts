import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler'
import { AuthRequest } from '../middlewares/authenticate'

const prisma = new PrismaClient()

export const auditController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, action, entityType, userId, startDate, endDate } = req.query as any
    const p = Number(page) || 1
    const l = Number(limit) || 50

    const where: any = {}
    if (action) where.action = { contains: action, mode: 'insensitive' }
    if (entityType) where.entityType = entityType
    if (userId) where.userId = userId
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [data, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip: (p - 1) * l,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.activityLog.count({ where }),
    ])

    res.json({ data, total, page: p, limit: l, totalPages: Math.ceil(total / l) })
  }),
}
