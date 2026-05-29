import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { signAccessToken, generateToken, TokenPayload } from '../utils/token'
import { sendEmail, EmailTemplates } from '../utils/email'
import { AppError } from '../middlewares/errorHandler'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173'

export const authService = {
  async login(email: string, password: string, userAgent?: string, ip?: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) throw new AppError('Invalid credentials', 401)

    const match = await bcrypt.compare(password, user.passwordHash)
    if (!match) throw new AppError('Invalid credentials', 401)

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } })

    const payload: TokenPayload = { userId: user.id, role: user.role, companyId: user.companyId }
    const accessToken = signAccessToken(payload)
    const refreshToken = generateToken()

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.session.create({ data: { userId: user.id, refreshToken, expiresAt, userAgent, ip } })

    logger.info(`[auth] Login: ${email}`)
    return { accessToken, refreshToken, user: sanitizeUser(user) }
  },

  async refresh(refreshToken: string) {
    const session = await prisma.session.findUnique({ where: { refreshToken } })
    if (!session || session.expiresAt < new Date()) {
      if (session) await prisma.session.delete({ where: { id: session.id } })
      throw new AppError('Invalid refresh token', 401)
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user || !user.isActive) throw new AppError('User not found', 401)

    const newPayload: TokenPayload = { userId: user.id, role: user.role, companyId: user.companyId }
    const newAccess = signAccessToken(newPayload)
    const newRefresh = generateToken()
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // Atomic rotation: delete old session and create new one in one transaction.
    // Catch P2025 (record-to-delete not found) which can happen if two refresh
    // requests race (e.g. React StrictMode double-effect) — treat as invalid token.
    try {
      await prisma.$transaction([
        prisma.session.delete({ where: { id: session.id } }),
        prisma.session.create({
          data: {
            userId: user.id,
            refreshToken: newRefresh,
            expiresAt: newExpiry,
            userAgent: session.userAgent,
            ip: session.ip,
          },
        }),
      ])
    } catch (e: any) {
      if (e?.code === 'P2025') throw new AppError('Session already consumed', 401)
      throw e
    }

    return { accessToken: newAccess, refreshToken: newRefresh }
  },

  async logout(refreshToken: string) {
    await prisma.session.deleteMany({ where: { refreshToken } })
  },

  async updateProfile(userId: string, firstName: string, lastName: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName },
    })
    return sanitizeUser(user)
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new AppError('User not found', 404)
    return sanitizeUser(user)
  },

  async inviteUser(email: string, role: string, companyId: string | undefined, invitedById: string) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new AppError('User with this email already exists')

    const inviteToken = generateToken()
    const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: '',
        role: role as any,
        companyId,
        inviteToken,
        inviteExpiry,
        isActive: false,
      },
    })

    const inviteUrl = `${CLIENT_URL}/accept-invite?token=${inviteToken}`
    const tpl = EmailTemplates.invite('', inviteUrl)
    await sendEmail(email, tpl.subject, tpl.html)

    logger.info(`[auth] Invite sent to ${email} by ${invitedById}`)
    return user
  },

  async acceptInvite(token: string, password: string, firstName: string, lastName: string) {
    const user = await prisma.user.findUnique({ where: { inviteToken: token } })
    if (!user || !user.inviteExpiry || user.inviteExpiry < new Date()) {
      throw new AppError('Invalid or expired invite link', 400)
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, firstName, lastName, isActive: true, inviteToken: null, inviteExpiry: null },
    })

    if (user.companyId) {
      await prisma.contact.updateMany({
        where: { email: user.email },
        data: { userId: user.id, inviteStatus: 'ACCEPTED' },
      })
    }

    logger.info(`[auth] Invite accepted: ${user.email}`)
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return // silent to prevent user enumeration

    const resetToken = generateToken()
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.user.update({ where: { id: user.id }, data: { resetToken, resetExpiry } })

    const resetUrl = `${CLIENT_URL}/reset-password?token=${resetToken}`
    const tpl = EmailTemplates.passwordReset(resetUrl)
    await sendEmail(email, tpl.subject, tpl.html)
  },

  async resetPassword(token: string, password: string) {
    const user = await prisma.user.findUnique({ where: { resetToken: token } })
    if (!user || !user.resetExpiry || user.resetExpiry < new Date()) {
      throw new AppError('Invalid or expired reset link', 400)
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetExpiry: null },
    })
    await prisma.session.deleteMany({ where: { userId: user.id } })
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new AppError('User not found', 404)

    const match = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!match) throw new AppError('Current password is incorrect', 400)

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
    await prisma.session.deleteMany({ where: { userId } })
  },

  async updateNotificationPreferences(userId: string, prefs: Record<string, boolean>) {
    await prisma.user.update({ where: { id: userId }, data: { notificationPreferences: prefs } })
  },
}

function sanitizeUser(user: { id: string; email: string; firstName: string; lastName: string; role: string; companyId: string | null; isActive: boolean; lastLogin: Date | null; avatarUrl: string | null; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    companyId: user.companyId,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  }
}
