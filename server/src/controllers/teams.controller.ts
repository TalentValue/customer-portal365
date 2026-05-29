import { Response } from 'express'
import { teamsService } from '../services/teams.service'
import { asyncHandler } from '../utils/asyncHandler'
import { AuthRequest } from '../middlewares/authenticate'

export const teamsController = {
  list: asyncHandler(async (_req: AuthRequest, res: Response) => {
    res.json(await teamsService.list())
  }),

  get: asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json(await teamsService.get(req.params.id))
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    res.status(201).json(await teamsService.create(req.body.name))
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json(await teamsService.update(req.params.id, req.body.name))
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response) => {
    await teamsService.delete(req.params.id)
    res.status(204).end()
  }),

  addMember: asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json(await teamsService.addMember(req.params.id, req.body.userId))
  }),

  removeMember: asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json(await teamsService.removeMember(req.params.id, req.params.userId))
  }),
}
