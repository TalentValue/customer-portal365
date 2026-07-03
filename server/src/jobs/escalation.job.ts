import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { notificationsService } from '../services/notifications.service'
import { ticketsService } from '../services/tickets.service'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

export function startEscalationJob() {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    logger.info('[job] Running escalation job')
    try {
      const now = new Date()

      const overdue = await prisma.ticket.findMany({
        where: {
          status: { notIn: ['COMPLETED', 'CLOSED', 'OVERDUE'] },
          OR: [
            { slaDeadline: { lt: now } },
            { dueDate: { lt: now } },
          ],
        },
        include: { company: { include: { accountManager: true } } },
      })

      for (const ticket of overdue) {
        await ticketsService.escalateToOverdue(ticket.id)

        if (ticket.company?.accountManager) {
          const deadline = ticket.slaDeadline ?? ticket.dueDate
          await notificationsService.create(ticket.company.accountManager.id, {
            type: 'TICKET_OVERDUE',
            title: `Ticket overdue: ${ticket.title}`,
            body: `Deadline was ${deadline?.toISOString() ?? 'not set'}`,
            relatedId: ticket.id,
            relatedType: 'Ticket',
          })
        }

        logger.info(`[job] Escalated ticket ${ticket.id} to OVERDUE`)
      }
    } catch (err) {
      logger.error('[job] Escalation job failed:', err)
    }
  })
}
