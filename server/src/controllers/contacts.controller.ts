import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler'
import { AuthRequest } from '../middlewares/authenticate'
import { AppError } from '../middlewares/errorHandler'
import { authService } from '../services/auth.service'

const prisma = new PrismaClient()

export const contactsController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, search, companyId, sortBy, sortDir } = req.query as any
    const p = Number(page) || 1
    const l = Number(limit) || 50
    const allowedSort = ['firstName', 'lastName', 'email', 'createdAt']
    const orderField = allowedSort.includes(sortBy) ? sortBy : 'createdAt'
    const orderDir = sortDir === 'asc' ? 'asc' : 'desc'
    const where: any = {}

    // ADMIN is scoped to their own company; SUPER_ADMIN may filter by query param
    if (req.user?.role === 'ADMIN' && req.user?.companyId) {
      where.companyId = req.user.companyId
    } else if (companyId) {
      where.companyId = companyId
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: { company: { select: { id: true, name: true } } },
        skip: (p - 1) * l,
        take: l,
        orderBy: { [orderField]: orderDir },
      }),
      prisma.contact.count({ where }),
    ])
    res.json({ data, total, page: p, limit: l, totalPages: Math.ceil(total / l) })
  }),

  get: asyncHandler(async (req: AuthRequest, res: Response) => {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id },
      include: { company: { select: { id: true, name: true } } },
    })
    if (!contact) throw new AppError('Contact not found', 404)

    // ADMIN may only view contacts from their own company
    if (req.user?.role === 'ADMIN' && req.user?.companyId && contact.companyId !== req.user.companyId) {
      throw new AppError('Contact not found', 404)
    }

    let portalUser = null
    if (contact.userId) {
      portalUser = await prisma.user.findUnique({
        where: { id: contact.userId },
        select: { id: true, role: true, lastLogin: true },
      })
    }

    res.json({ ...contact, portalUser })
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { firstName, lastName, email, phone, designation, companyId, isActive } = req.body
    if (!firstName) throw new AppError('firstName is required', 400)
    if (!lastName) throw new AppError('lastName is required', 400)
    if (!email) throw new AppError('email is required', 400)
    if (!companyId) throw new AppError('companyId is required', 400)
    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone?.trim() || null,
        designation: designation?.trim() || null,
        companyId,
        isActive: isActive ?? true,
        // inviteStatus intentionally omitted — always starts as PENDING (DB default)
      },
    })
    res.status(201).json(contact)
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { firstName, lastName, email, phone, designation, isActive } = req.body
    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: {
        firstName,
        lastName,
        email,
        // empty string clears the field to null; undefined means "not sent — keep existing"
        phone: phone !== undefined ? (phone.trim() || null) : undefined,
        designation: designation !== undefined ? (designation.trim() || null) : undefined,
        isActive,
        // companyId, userId, inviteStatus not updatable via this endpoint
      },
    })
    res.json(contact)
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response) => {
    await prisma.contact.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),

  invite: asyncHandler(async (req: AuthRequest, res: Response) => {
    const contact = await prisma.contact.findUnique({ where: { id: req.params.id } })
    if (!contact) throw new AppError('Contact not found', 404)
    await authService.inviteUser(contact.email, 'CLIENT', contact.companyId, req.user!.userId)
    await prisma.contact.update({ where: { id: req.params.id }, data: { inviteStatus: 'PENDING' } })
    res.json({ message: 'Invite sent' })
  }),
}
