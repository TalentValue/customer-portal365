import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

export function startAutoCloseJob() {
  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('[job] Running auto-close job')

    // Get configurable days from settings (default 30)
    const setting = await prisma.setting.findFirst({ where: { key: 'auto_close_days', companyId: null } })
    const days = parseInt(setting?.value ?? '30', 10)

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const result = await prisma.ticket.updateMany({
      where: {
        updatedAt: { lt: cutoff },
        status: { in: ['WAITING_FOR_CLIENT', 'OPEN'] },
      },
      data: { status: 'CLOSED' },
    })

    if (result.count > 0) {
      logger.info(`[job] Auto-closed ${result.count} inactive tickets`)
    }
  })
}
