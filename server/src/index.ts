import 'dotenv/config'
import { createServer } from 'http'
import { Server as SocketIO } from 'socket.io'
import app from './app'
import { initSockets } from './sockets'
import { startRemindersJob } from './jobs/reminders.job'
import { startEscalationJob } from './jobs/escalation.job'
import { startAutoCloseJob } from './jobs/autoClose.job'
import { startRecurringJob } from './jobs/recurring.job'
import { logger } from './utils/logger'

const PORT = parseInt(process.env.SERVER_PORT ?? '3001', 10)

const httpServer = createServer(app)

const io = new SocketIO(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  },
})

initSockets(io)

// Start cron jobs
startRemindersJob()
startEscalationJob()
startAutoCloseJob()
startRecurringJob()

httpServer.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV ?? 'development'}`)
})

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', { err })
})
