import { Response } from 'express'
import { companiesService } from '../services/companies.service'
import { asyncHandler } from '../utils/asyncHandler'
import { AuthRequest } from '../middlewares/authenticate'

export const companiesController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, search, status, sortBy, sortDir } = req.query as any
    const data = await companiesService.list({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search,
      status,
      sortBy,
      sortDir,
      userId: req.user!.userId,
      role: req.user!.role,
    })
    res.json(data)
  }),

  get: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await companiesService.get(req.params.id)
    res.json(data)
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await companiesService.create(req.body)
    res.status(201).json(data)
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await companiesService.update(req.params.id, req.body)
    res.json(data)
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response) => {
    await companiesService.delete(req.params.id)
    res.status(204).end()
  }),

  archive: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await companiesService.archive(req.params.id)
    res.json(data)
  }),

  uploadLogo: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) { res.status(400).json({ message: 'No file provided' }); return }
    const logoUrl = await companiesService.uploadLogo(
      req.params.id,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    )
    res.json({ logoUrl })
  }),

  getActivity: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { limit } = req.query as any
    const data = await companiesService.getActivity(req.params.id, Number(limit) || 30)
    res.json(data)
  }),

  getUploads: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { limit } = req.query as any
    const data = await companiesService.getUploads(req.params.id, Number(limit) || 20)
    res.json(data)
  }),

  getNotifications: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { limit } = req.query as any
    const data = await companiesService.getNotifications(req.params.id, Number(limit) || 30)
    res.json(data)
  }),
}
