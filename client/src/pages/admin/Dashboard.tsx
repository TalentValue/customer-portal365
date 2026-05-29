import { useQuery } from '@tanstack/react-query'
import { Building2, Ticket, AlertCircle, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { formatRelative } from '@/utils/formatDate'
import api from '@/services/api'
import { DashboardStats } from '@/types'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function StatCard({ title, value, icon: Icon, description, color = 'text-primary' }: {
  title: string; value: number | string; icon: React.ElementType; description?: string; color?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}

const SAMPLE_CHART = Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  tickets: Math.floor(Math.random() * 20) + 5,
  resolved: Math.floor(Math.random() * 15) + 2,
}))

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/analytics/dashboard').then((r) => r.data),
  })

  if (isLoading) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of ClientPortal365 activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Companies" value={data?.totalCompanies ?? 0} icon={Building2} description="Active client companies" />
        <StatCard title="Active Tickets" value={data?.activeTickets ?? 0} icon={Ticket} description="Open and in-progress" color="text-blue-500" />
        <StatCard title="Overdue Tickets" value={data?.overdueTickets ?? 0} icon={AlertCircle} description="Require immediate attention" color="text-destructive" />
        <StatCard title="Pending Approvals" value={data?.pendingApprovals ?? 0} icon={Clock} description="Awaiting client response" color="text-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ticket Activity (This Week)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={SAMPLE_CHART}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip />
                <Area type="monotone" dataKey="tickets" name="Created" stroke="#6366f1" fill="#6366f133" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#22c55e" fill="#22c55e33" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.recentActivity?.slice(0, 8).map((log) => (
              <div key={log.id} className="flex items-start gap-2">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="text-xs font-medium">{log.action}</p>
                  <p className="text-xs text-muted-foreground">{formatRelative(log.createdAt)}</p>
                </div>
              </div>
            )) ?? <p className="text-xs text-muted-foreground">No recent activity</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
