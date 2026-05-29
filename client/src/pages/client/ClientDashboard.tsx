import { useQuery } from '@tanstack/react-query'
import { Ticket, Bell, Calendar, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TicketCard } from '@/components/tickets/TicketCard'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { useAuthStore } from '@/store/authStore'
import { ticketsService } from '@/services/tickets.service'
import { notificationsService } from '@/services/notifications.service'
import { formatDate } from '@/utils/formatDate'

export default function ClientDashboard() {
  const { user } = useAuthStore()

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['client-tickets'],
    queryFn: () => ticketsService.list({ limit: 5 }).then((r) => r.data),
  })

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsService.getUnreadCount().then((r) => r.data),
  })

  if (isLoading) return <PageSkeleton />

  const openTickets = ticketsData?.data?.filter((t) => !['COMPLETED', 'CLOSED'].includes(t.status)) ?? []
  const overdueTickets = ticketsData?.data?.filter((t) => t.status === 'OVERDUE') ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h1>
        <p className="text-muted-foreground text-sm">Here's what needs your attention today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{openTickets.length}</div>
              <div className="text-xs text-muted-foreground">Open Tickets</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{notifData?.count ?? 0}</div>
              <div className="text-xs text-muted-foreground">Unread Notifications</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{overdueTickets.length}</div>
              <div className="text-xs text-muted-foreground">Overdue Items</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Tickets</h2>
          <Button variant="outline" size="sm" asChild>
            <a href="/portal/tickets">View all</a>
          </Button>
        </div>
        {ticketsData?.data?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ticketsData.data.slice(0, 4).map((t) => <TicketCard key={t.id} ticket={t} showCompany={false} />)}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No tickets assigned to you yet.</p>
        )}
      </div>
    </div>
  )
}
