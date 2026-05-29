import { Request, Response } from 'express'
import { authService } from '../services/auth.service'
import { asyncHandler } from '../utils/asyncHandler'
import { AuthRequest } from '../middlewares/authenticate'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body
    const { accessToken, refreshToken, user } = await authService.login(
      email, password,
      req.headers['user-agent'],
      req.ip
    )
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS)
    res.json({ accessToken, user })
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken
    if (token) await authService.logout(token)
    res.clearCookie('refreshToken')
    res.json({ message: 'Logged out' })
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken
    if (!token) { res.status(401).json({ message: 'No refresh token' }); return }
    const { accessToken, refreshToken } = await authService.refresh(token)
    res.cookie('refreshToken', refreshToken, COOKIE_OPTS)
    res.json({ accessToken })
  }),

  me: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await authService.me(req.user!.userId)
    res.json(user)
  }),

  invite: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, role, companyId } = req.body
    const user = await authService.inviteUser(email, role, companyId, req.user!.userId)
    res.status(201).json({ message: 'Invite sent', userId: user.id })
  }),

  acceptInvite: asyncHandler(async (req: Request, res: Response) => {
    const { token, password, firstName, lastName } = req.body
    await authService.acceptInvite(token, password, firstName, lastName)
    res.json({ message: 'Account created successfully' })
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body
    await authService.forgotPassword(email)
    res.json({ message: 'If that email exists, a reset link was sent.' })
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body
    await authService.resetPassword(token, password)
    res.json({ message: 'Password reset successfully' })
  }),

  changePassword: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body
    await authService.changePassword(req.user!.userId, currentPassword, newPassword)
    res.json({ message: 'Password updated' })
  }),

  updateProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { firstName, lastName } = req.body
    if (!firstName || !lastName) { res.status(400).json({ message: 'firstName and lastName are required' }); return }
    const user = await authService.updateProfile(req.user!.userId, firstName, lastName)
    res.json(user)
  }),

  getNotificationPreferences: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await authService.me(req.user!.userId)
    res.json((user as any).notificationPreferences ?? {})
  }),

  updateNotificationPreferences: asyncHandler(async (req: AuthRequest, res: Response) => {
    const prefs = req.body
    await authService.updateNotificationPreferences(req.user!.userId, prefs)
    res.json(prefs)
  }),
}
