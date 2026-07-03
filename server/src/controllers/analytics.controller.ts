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
    const { startDate, endDate, companyId } = req.query as Record<string, string>
    const data = await analyticsService.getAnalytics({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      companyId: companyId || undefined,
      userId: req.user!.userId,
      role: req.user!.role,
    })
    res.json(data)
  }),
}
