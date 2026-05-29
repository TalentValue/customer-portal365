import { PrismaClient } from '@prisma/client'
import { AppError } from '../middlewares/errorHandler'

const prisma = new PrismaClient()

export const templatesService = {
  async list() {
    return prisma.ticketTemplate.findMany({
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { name: 'asc' },
    })
  },

  async get(id: string) {
    const template = await prisma.ticketTemplate.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
    })
    if (!template) throw new AppError('Template not found', 404)
    return template
  },

  async create(data: any, userId: string) {
    if (!data.name) throw new AppError('Name is required', 400)
    if (!data.title) throw new AppError('Title is required', 400)
    return prisma.ticketTemplate.create({
      data: {
        name: data.name,
        title: data.title,
        description: data.description || undefined,
        type: data.type ?? 'GENERAL_TASK',
        priority: data.priority ?? 'MEDIUM',
        tags: data.tags ?? [],
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
    })
  },

  async update(id: string, data: any) {
    const template = await prisma.ticketTemplate.findUnique({ where: { id } })
    if (!template) throw new AppError('Template not found', 404)
    return prisma.ticketTemplate.update({
      where: { id },
      data: {
        name: data.name || undefined,
        title: data.title || undefined,
        description: data.description !== undefined ? (data.description || null) : undefined,
        type: data.type || undefined,
        priority: data.priority || undefined,
        tags: data.tags ?? undefined,
      },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
    })
  },

  async delete(id: string) {
    const template = await prisma.ticketTemplate.findUnique({ where: { id } })
    if (!template) throw new AppError('Template not found', 404)
    await prisma.ticketTemplate.delete({ where: { id } })
  },
}
