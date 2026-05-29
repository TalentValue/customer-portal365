import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const analyticsService = {
  async dashboard(userId: string, role: string) {
    const companyWhere = role === 'ADMIN' ? { accountManagerId: userId } : {}
    const ticketWhere = role === 'ADMIN' ? { company: { accountManagerId: userId } } : {}

    const [
      totalCompanies,
      activeTickets,
      overdueTickets,
      pendingApprovals,
      recentActivity,
    ] = await Promise.all([
      prisma.company.count({ where: { ...companyWhere, status: 'ACTIVE' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: { in: ['OPEN', 'IN_PROGRESS', 'SUBMITTED', 'WAITING_FOR_CLIENT'] } } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'OVERDUE' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: { in: ['SUBMITTED', 'APPROVED'] } } }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      }),
    ])

    const totalTickets = await prisma.ticket.count({ where: ticketWhere })
    const completedTickets = await prisma.ticket.count({ where: { ...ticketWhere, status: { in: ['COMPLETED', 'CLOSED'] } } })
    const completionRate = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0

    return { totalCompanies, activeTickets, overdueTickets, pendingApprovals, completionRate, recentActivity }
  },

  async getAnalytics() {
    const now = new Date()

    // Build month boundaries for last 6 months
    const months = Array.from({ length: 6 }, (_, i) => {
      const start = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const end = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1)
      return { start, end, label: start.toLocaleString('default', { month: 'short' }) }
    })

    const [ticketsByStatus, ...monthlyPairs] = await Promise.all([
      prisma.ticket.groupBy({ by: ['status'], _count: { id: true } }),
      ...months.flatMap(({ start, end }) => [
        prisma.ticket.count({ where: { createdAt: { gte: start, lt: end } } }),
        prisma.ticket.count({ where: { status: { in: ['COMPLETED', 'CLOSED'] }, updatedAt: { gte: start, lt: end } } }),
      ]),
    ])

    const monthlyTickets = months.map((m, i) => ({
      month: m.label,
      created: monthlyPairs[i * 2] as number,
      resolved: monthlyPairs[i * 2 + 1] as number,
    }))

    const totalTickets = await prisma.ticket.count()
    const completedTickets = await prisma.ticket.count({ where: { status: { in: ['COMPLETED', 'CLOSED'] } } })
    const overdueTickets = await prisma.ticket.count({ where: { status: 'OVERDUE' } })
    const openTickets = await prisma.ticket.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CLIENT', 'SUBMITTED'] } },
    })

    return {
      ticketsByStatus: ticketsByStatus.map((r) => ({
        name: r.status.replace(/_/g, ' '),
        value: r._count.id,
      })),
      monthlyTickets,
      summary: {
        totalTickets,
        completedTickets,
        overdueTickets,
        openTickets,
        completionRate: totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0,
      },
    }
  },
}
