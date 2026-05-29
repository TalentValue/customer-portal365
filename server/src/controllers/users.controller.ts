import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler'
import { AuthRequest } from '../middlewares/authenticate'

const prisma = new PrismaClient()

export const usersController = {
  list: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const users = await prisma.user.findMany({
      where: { isActive: true, role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    })
    res.json(users)
  }),
}
