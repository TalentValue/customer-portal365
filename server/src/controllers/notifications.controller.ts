import { Response } from 'express'
import { notificationsService } from '../services/notifications.service'
import { asyncHandler } from '../utils/asyncHandler'
import { AuthRequest } from '../middlewares/authenticate'

export const notificationsController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, unreadOnly } = req.query as any
    const data = await notificationsService.list(req.user!.userId, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      unreadOnly: unreadOnly === 'true',
    })
    res.json(data)
  }),

  unreadCount: asyncHandler(async (req: AuthRequest, res: Response) => {
    const count = await notificationsService.getUnreadCount(req.user!.userId)
    res.json({ count })
  }),

  markRead: asyncHandler(async (req: AuthRequest, res: Response) => {
    await notificationsService.markRead(req.params.id, req.user!.userId)
    res.json({ message: 'Marked as read' })
  }),

  markAllRead: asyncHandler(async (req: AuthRequest, res: Response) => {
    await notificationsService.markAllRead(req.user!.userId)
    res.json({ message: 'All marked as read' })
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response) => {
    await notificationsService.delete(req.params.id, req.user!.userId)
    res.status(204).end()
  }),
}
