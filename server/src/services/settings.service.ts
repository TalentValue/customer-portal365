import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const settingsService = {
  async getAll(companyId?: string | null) {
    return prisma.setting.findMany({
      where: { companyId: companyId ?? null },
      orderBy: { key: 'asc' },
    })
  },

  async get(key: string, companyId?: string | null) {
    return prisma.setting.findFirst({
      where: { key, companyId: companyId ?? null },
    })
  },

  async upsert(key: string, value: string, companyId?: string | null) {
    const cid = companyId ?? null
    return prisma.setting.upsert({
      where: { key_companyId: { key, companyId: cid as string } },
      create: { key, value, companyId: cid },
      update: { value },
    })
  },

  async upsertMany(settings: { key: string; value: string }[], companyId?: string | null) {
    const cid = companyId ?? null
    return prisma.$transaction(
      settings.map(({ key, value }) =>
        prisma.setting.upsert({
          where: { key_companyId: { key, companyId: cid as string } },
          create: { key, value, companyId: cid },
          update: { value },
        })
      )
    )
  },
}
