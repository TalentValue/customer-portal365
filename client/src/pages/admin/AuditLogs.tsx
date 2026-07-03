import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import api from '@/services/api'
import { ActivityLog } from '@/types'
import { formatDateTime } from '@/utils/formatDate'

const ENTITY_TYPES = [
  'Ticket', 'Company', 'Contact', 'User', 'Team', 'Template', 'Setting', 'Reminder',
]

const PAGE_SIZE = 25

export default function AuditLogs() {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const params: Record<string, string | number> = { page, limit: PAGE_SIZE }
  if (action.trim()) params.action = action.trim()
  if (entityType && entityType !== 'all') params.entityType = entityType
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, action, entityType, startDate, endDate],
    queryFn: () => api.get('/audit-logs', { params }).then((r) => r.data),
  })

  const logs: ActivityLog[] = data?.data ?? []
  const total: number = data?.total ?? 0
  const totalPages: number = data?.totalPages ?? 1

  function clearFilters() {
    setPage(1)
    setAction('')
    setEntityType('all')
    setStartDate('')
    setEndDate('')
  }

  const hasFilters = action || (entityType && entityType !== 'all') || startDate || endDate

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground text-sm">Track all platform activity and changes</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Filter by action…"
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>

        <Select value={entityType} onValueChange={(v) => { setEntityType(v); setPage(1) }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {ENTITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
            className="w-[150px]"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
            className="w-[150px]"
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? 'entry' : 'entries'}{hasFilters ? ' matching filters' : ' total'}
        </p>
      )}

      {/* Log list */}
      {isLoading ? (
        <TableSkeleton />
      ) : !logs.length ? (
        <EmptyState
          icon={FileText}
          title="No audit logs"
          description={hasFilters ? 'No results match your filters.' : 'Activity will appear here as users interact with the platform.'}
        />
      ) : (
        <div className="rounded-lg border divide-y bg-white">
          {logs.map((log: ActivityLog) => (
            <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {log.user ? `${log.user.firstName[0]}${log.user.lastName[0]}` : 'SY'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">
                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                  </span>
                  <Badge variant="outline" className="text-xs">{log.action}</Badge>
                  <span className="text-xs text-muted-foreground">on</span>
                  <Badge variant="secondary" className="text-xs">{log.entityType}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(log.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
