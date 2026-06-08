import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { settingsService } from '../services/settings.service'
import { sendEmail } from '../utils/email'
import { asyncHandler } from '../utils/asyncHandler'
import { AuthRequest } from '../middlewares/authenticate'

const prisma = new PrismaClient()

export const settingsController = {
  list: asyncHandler(async (_req: AuthRequest, res: Response) => {
    res.json(await settingsService.getAll(null))
  }),

  get: asyncHandler(async (req: AuthRequest, res: Response) => {
    const setting = await settingsService.get(req.params.key, null)
    if (!setting) { res.status(404).json({ message: 'Setting not found' }); return }
    res.json(setting)
  }),

  upsertMany: asyncHandler(async (req: AuthRequest, res: Response) => {
    const settings: { key: string; value: string }[] = req.body.settings ?? []
    if (!Array.isArray(settings) || !settings.every((s) => s.key && s.value !== undefined)) {
      res.status(400).json({ message: 'Expected { settings: [{ key, value }] }' }); return
    }
    res.json(await settingsService.upsertMany(settings, null))
  }),

  listForCompany: asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json(await settingsService.getAll(req.params.id))
  }),

  upsertForCompany: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { key, value } = req.body
    if (!key || value === undefined) {
      res.status(400).json({ message: 'key and value are required' }); return
    }
    res.json(await settingsService.upsert(key, String(value), req.params.id))
  }),

  testEmail: asyncHandler(async (req: AuthRequest, res: Response) => {
    const to = req.body.to as string | undefined
    let recipient = to?.trim()
    if (!recipient) {
      const currentUser = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { email: true } })
      if (!currentUser) { res.status(404).json({ message: 'User not found' }); return }
      recipient = currentUser.email
    }
    await sendEmail(
      recipient,
      'ClientPortal365 — Test Email',
      '<p>This is a test email from ClientPortal365.</p><p>If you received this, your email configuration is working correctly.</p>',
    )
    res.json({ message: `Test email sent to ${recipient}` })
  }),
}
