import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

const PATTERN_DAYS: Record<string, number> = {
  DAILY: 1,
  WEEKLY: 7,
  MONTHLY: 30,
  YEARLY: 365,
}

export function startRecurringJob() {
  // Run daily at 1:00 AM
  cron.schedule('0 1 * * *', async () => {
    logger.info('[job] Running recurring tickets job')
    const now = new Date()

    const parents = await prisma.ticket.findMany({
      where: {
        isRecurring: true,
        recurrencePattern: { not: null },
        status: { in: ['COMPLETED', 'CLOSED'] },
        OR: [{ recurrenceEndDate: null }, { recurrenceEndDate: { gte: now } }],
      },
    })

    for (const ticket of parents) {
      if (!ticket.recurrencePattern) continue
      const days = PATTERN_DAYS[ticket.recurrencePattern]
      if (!days) continue

      // Skip if a child was already created within the recurrence window
      const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      const recentChild = await prisma.ticket.findFirst({
        where: { parentTicketId: ticket.id, createdAt: { gte: since } },
      })
      if (recentChild) continue

      const dueDate = ticket.dueDate
        ? new Date(ticket.dueDate.getTime() + days * 24 * 60 * 60 * 1000)
        : undefined

      await prisma.ticket.create({
        data: {
          title: ticket.title,
          description: ticket.description ?? undefined,
          type: ticket.type,
          status: 'OPEN',
          priority: ticket.priority,
          companyId: ticket.companyId,
          assigneeId: ticket.assigneeId ?? undefined,
          teamId: ticket.teamId ?? undefined,
          tags: ticket.tags,
          dueDate,
          isRecurring: true,
          recurrencePattern: ticket.recurrencePattern,
          recurrenceEndDate: ticket.recurrenceEndDate ?? undefined,
          parentTicketId: ticket.id,
        },
      })
      logger.info(`[job] Created recurring instance of ticket ${ticket.id}`)
    }
  })
}
