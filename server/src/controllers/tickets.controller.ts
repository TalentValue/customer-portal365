import { Response } from 'express'
import { ticketsService } from '../services/tickets.service'
import { asyncHandler } from '../utils/asyncHandler'
import { AuthRequest } from '../middlewares/authenticate'

export const ticketsController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, search, status, priority, assigneeId, archived } = req.query as any
    const companyId = req.user!.role === 'CLIENT'
      ? (req.user!.companyId ?? undefined)
      : (req.query.companyId as string | undefined)

    const data = await ticketsService.list({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search, status, priority, companyId, assigneeId,
      userId: req.user!.userId,
      role: req.user!.role,
      archived: archived === 'true',
    })
    res.json(data)
  }),

  get: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await ticketsService.get(req.params.id, req.user!.userId, req.user!.role, req.user!.companyId ?? null)
    res.json(data)
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = { ...req.body }
    if (req.user!.role === 'CLIENT') {
      body.companyId = req.user!.companyId
      body.status = 'SUBMITTED'
    }
    const data = await ticketsService.create(body, req.user!.userId)
    res.status(201).json(data)
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, description, type, priority, assigneeId, teamId, clientContactId, dueDate, slaDeadline, tags, isRecurring, recurrencePattern, recurrenceEndDate } = req.body
    const data = await ticketsService.update(req.params.id, {
      title, description, type, priority,
      assigneeId: assigneeId || undefined,
      teamId: teamId || undefined,
      clientContactId: clientContactId || undefined,
      dueDate: dueDate || undefined,
      slaDeadline: slaDeadline || undefined,
      tags,
      isRecurring,
      recurrencePattern: recurrencePattern || undefined,
      recurrenceEndDate: recurrenceEndDate || undefined,
    }, req.user!.userId, req.user!.role, req.user!.companyId ?? null)
    res.json(data)
  }),

  archive: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await ticketsService.archive(req.params.id, req.user!.userId, req.user!.role, req.user!.companyId ?? null)
    res.json(data)
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response) => {
    await ticketsService.delete(req.params.id, req.user!.userId, req.user!.role, req.user!.companyId ?? null)
    res.status(204).end()
  }),

  updateStatus: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await ticketsService.updateStatus(req.params.id, req.body.status, req.user!.userId)
    res.json(data)
  }),

  getComments: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await ticketsService.getComments(req.params.id, req.user!.userId, req.user!.role)
    res.json(data)
  }),

  addComment: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { body } = req.body
    // CLIENT users can never post internal comments
    const isInternal = req.user!.role === 'CLIENT' ? false : (req.body.isInternal ?? false)
    const data = await ticketsService.addComment(req.params.id, body, isInternal, req.user!.userId)
    res.status(201).json(data)
  }),

  deleteComment: asyncHandler(async (req: AuthRequest, res: Response) => {
    await ticketsService.deleteComment(req.params.id, req.params.commentId, req.user!.userId, req.user!.role)
    res.status(204).end()
  }),

  getAttachments: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await ticketsService.getAttachments(req.params.id)
    res.json(data)
  }),

  uploadAttachment: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) { res.status(400).json({ message: 'No file provided' }); return }
    const data = await ticketsService.uploadAttachment(req.params.id, req.file, req.user!.userId)
    res.status(201).json(data)
  }),

  deleteAttachment: asyncHandler(async (req: AuthRequest, res: Response) => {
    await ticketsService.deleteAttachment(req.params.id, req.params.attachmentId, req.user!.userId, req.user!.role)
    res.status(204).end()
  }),

  watch: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await ticketsService.toggleWatch(req.params.id, req.user!.userId)
    res.json(result)
  }),

  getActivity: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await ticketsService.getActivity(req.params.id, Number(req.query.limit) || 50)
    res.json(data)
  }),

  clientComplete: asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await ticketsService.clientComplete(req.params.id, req.user!.userId, req.user!.companyId ?? null)
    res.json(data)
  }),
}
