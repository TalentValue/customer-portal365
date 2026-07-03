import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { X, Ticket, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react'
import api from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

interface Company { id: string; name: string }

export default function Analytics() {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [companyId, setCompanyId] = useState('all')

  const params: Record<string, string> = {}
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate
  if (companyId && companyId !== 'all') params.companyId = companyId

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', startDate, endDate, companyId],
    queryFn: () => api.get('/analytics', { params }).then((r) => r.data),
  })

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies-simple'],
    queryFn: () => api.get('/companies').then((r) => r.data?.data ?? r.data),
    enabled: isSuperAdmin,
  })

  const hasFilters = startDate || endDate || (companyId && companyId !== 'all')

  if (isLoading) return <PageSkeleton />

  const statusData: { name: string; value: number }[] = data?.ticketsByStatus ?? []
  const monthlyData: { month: string; created: number; resolved: number }[] = data?.monthlyTickets ?? []
  const summary = data?.summary ?? { totalTickets: 0, openTickets: 0, overdueTickets: 0, completionRate: 0 }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm">Performance metrics and insights</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[150px]"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[150px]"
          />
        </div>
        {isSuperAdmin && (
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All companies</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            onClick={() => { setStartDate(''); setEndDate(''); setCompanyId('all') }}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Ticket className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.totalTickets}</p>
              <p className="text-xs text-muted-foreground">Total Tickets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.openTickets}</p>
              <p className="text-xs text-muted-foreground">Active Tickets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.overdueTickets}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.completionRate}%</p>
              <p className="text-xs text-muted-foreground">Completion Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Monthly Ticket Volume (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {!monthlyData.length ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="created" name="Created" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" name="Resolved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tickets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {!statusData.length ? (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">No tickets yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((_: unknown, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
