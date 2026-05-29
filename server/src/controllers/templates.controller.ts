import { Response } from 'express'
import { templatesService } from '../services/templates.service'
import { asyncHandler } from '../utils/asyncHandler'
import { AuthRequest } from '../middlewares/authenticate'

export const templatesController = {
  list: asyncHandler(async (_req: AuthRequest, res: Response) => {
    res.json(await templatesService.list())
  }),

  get: asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json(await templatesService.get(req.params.id))
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await templatesService.create(req.body, req.user!.userId)
    res.status(201).json(data)
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json(await templatesService.update(req.params.id, req.body))
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response) => {
    await templatesService.delete(req.params.id)
    res.status(204).end()
  }),
}
