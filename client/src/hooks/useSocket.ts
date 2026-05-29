import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'

let socket: Socket | null = null

export function useSocket() {
  const { accessToken, user } = useAuthStore()
  const qc = useQueryClient()
  const initialized = useRef(false)

  useEffect(() => {
    if (!accessToken || !user || initialized.current) return
    initialized.current = true

    socket = io('/', {
      auth: { token: accessToken },
      transports: ['websocket'],
    })

    socket.on('notification:new', () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    })

    socket.on('ticket:updated', (ticketId: string) => {
      qc.invalidateQueries({ queryKey: ['tickets', ticketId] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
    })

    socket.on('comment:new', (ticketId: string) => {
      qc.invalidateQueries({ queryKey: ['tickets', ticketId, 'comments'] })
    })

    return () => {
      socket?.disconnect()
      socket = null
      initialized.current = false
    }
  }, [accessToken, user, qc])

  return socket
}
