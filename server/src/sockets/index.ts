import { Server as SocketIO } from 'socket.io'
import { verifyAccessToken } from '../utils/token'
import { logger } from '../utils/logger'

type Emitter = (event: string, data: unknown) => void

let _notifyUser: (userId: string, event: string, data: unknown) => void = () => {}
let _notifyTicket: (ticketId: string, event: string, data: unknown) => void = () => {}
let _broadcast: (event: string, data: unknown) => void = () => {}

export function notifyUser(userId: string, event: string, data: unknown) {
  _notifyUser(userId, event, data)
}

export function notifyTicket(ticketId: string, event: string, data: unknown) {
  _notifyTicket(ticketId, event, data)
}

export function broadcast(event: string, data: unknown) {
  _broadcast(event, data)
}

export function initSockets(io: SocketIO) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) { next(new Error('Authentication required')); return }
    try {
      const payload = verifyAccessToken(token)
      socket.data.user = payload
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const { userId } = socket.data.user
    logger.debug(`[socket] Connected: ${userId}`)

    socket.join(`user:${userId}`)

    socket.on('ticket:join', (ticketId: string) => {
      socket.join(`ticket:${ticketId}`)
    })

    socket.on('ticket:leave', (ticketId: string) => {
      socket.leave(`ticket:${ticketId}`)
    })

    socket.on('presence:join', (companyId: string) => {
      socket.join(`company:${companyId}`)
      io.to(`company:${companyId}`).emit('presence:user_joined', { userId })
    })

    socket.on('disconnect', () => {
      logger.debug(`[socket] Disconnected: ${userId}`)
    })
  })

  _notifyUser = (userId, event, data) => io.to(`user:${userId}`).emit(event, data)
  _notifyTicket = (ticketId, event, data) => io.to(`ticket:${ticketId}`).emit(event, data)
  _broadcast = (event, data) => io.emit(event, data)
}
