import { PrismaClient } from '@prisma/client'
import { AppError } from '../middlewares/errorHandler'

const prisma = new PrismaClient()

const memberInclude = {
  members: {
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true },
      },
    },
  },
}

export const teamsService = {
  async list() {
    return prisma.team.findMany({
      include: memberInclude,
      orderBy: { createdAt: 'desc' },
    })
  },

  async get(id: string) {
    const team = await prisma.team.findUnique({ where: { id }, include: memberInclude })
    if (!team) throw new AppError('Team not found', 404)
    return team
  },

  async create(name: string) {
    if (!name?.trim()) throw new AppError('Team name is required', 400)
    return prisma.team.create({ data: { name: name.trim() }, include: memberInclude })
  },

  async update(id: string, name: string) {
    const team = await prisma.team.findUnique({ where: { id } })
    if (!team) throw new AppError('Team not found', 404)
    if (!name?.trim()) throw new AppError('Team name is required', 400)
    return prisma.team.update({ where: { id }, data: { name: name.trim() }, include: memberInclude })
  },

  async delete(id: string) {
    const team = await prisma.team.findUnique({ where: { id } })
    if (!team) throw new AppError('Team not found', 404)
    await prisma.team.delete({ where: { id } })
  },

  async addMember(teamId: string, userId: string) {
    const [team, user] = await Promise.all([
      prisma.team.findUnique({ where: { id: teamId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ])
    if (!team) throw new AppError('Team not found', 404)
    if (!user) throw new AppError('User not found', 404)

    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId, userId } },
      create: { teamId, userId },
      update: {},
    })
    return teamsService.get(teamId)
  },

  async removeMember(teamId: string, userId: string) {
    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    })
    if (!member) throw new AppError('Member not found in team', 404)
    await prisma.teamMember.delete({ where: { teamId_userId: { teamId, userId } } })
    return teamsService.get(teamId)
  },
}
