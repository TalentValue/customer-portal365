import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { sendEmail, EmailTemplates } from '../utils/email'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173'

export function startRemindersJob() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('[job] Running reminders job')
    try {
    const now = new Date()

    const reminders = await prisma.reminder.findMany({
      where: { isActive: true },
      include: {
        ticket: { include: { clientContact: true } },
        company: true,
      },
    })

    for (const reminder of reminders) {
      const frequencyMs = reminder.frequency * 60 * 60 * 1000
      const shouldSend = !reminder.lastSentAt ||
        (now.getTime() - reminder.lastSentAt.getTime()) >= frequencyMs

      if (!shouldSend) continue
      if (!reminder.ticket.clientContact?.userId) continue

      const ticketUrl = `${CLIENT_URL}/portal/tickets/${reminder.ticketId}`
      const tpl = EmailTemplates.reminder(
        reminder.ticket.title,
        reminder.company.name,
        ticketUrl
      )

      if (reminder.ticket.clientContact) {
        const contact = await prisma.contact.findUnique({
          where: { id: reminder.ticket.clientContact.id },
        })
        if (contact) {
          await sendEmail(contact.email, tpl.subject, tpl.html)
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { lastSentAt: now },
          })
          logger.info(`[job] Reminder sent for ticket ${reminder.ticketId}`)
        }
      }
    }
    } catch (err) {
      logger.error('[job] Reminders job failed:', err)
    }
  })
}
