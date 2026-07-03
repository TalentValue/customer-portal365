import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler'
import { AuthRequest } from '../middlewares/authenticate'

const prisma = new PrismaClient()

export const remindersController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const where = req.user!.role === 'ADMIN'
      ? { company: { accountManagerId: req.user!.userId } }
      : {}

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        ticket: { select: { id: true, title: true, status: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(reminders)
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { ticketId, companyId, frequency } = req.body
    if (!ticketId || !companyId) {
      res.status(400).json({ message: 'ticketId and companyId are required' })
      return
    }
    const reminder = await prisma.reminder.create({
      data: {
        ticketId,
        companyId,
        frequency: Number(frequency) || 24,
      },
      include: {
        ticket: { select: { id: true, title: true, status: true } },
        company: { select: { id: true, name: true } },
      },
    })
    res.status(201).json(reminder)
  }),

  toggle: asyncHandler(async (req: AuthRequest, res: Response) => {
    const existing = await prisma.reminder.findUnique({ where: { id: req.params.id } })
    if (!existing) { res.status(404).json({ message: 'Not found' }); return }

    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: { isActive: !existing.isActive },
      include: {
        ticket: { select: { id: true, title: true, status: true } },
        company: { select: { id: true, name: true } },
      },
    })
    res.json(reminder)
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response) => {
    await prisma.reminder.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
}
