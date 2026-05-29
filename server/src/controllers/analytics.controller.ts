import { Response } from 'express'
import { analyticsService } from '../services/analytics.service'
import { asyncHandler } from '../utils/asyncHandler'
import { AuthRequest } from '../middlewares/authenticate'

export const analyticsController = {
  dashboard: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await analyticsService.dashboard(req.user!.userId, req.user!.role)
    res.json(data)
  }),

  analytics: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await analyticsService.getAnalytics()
    res.json(data)
  }),
}
