import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import api from '@/services/api'
import { ActivityLog } from '@/types'
import { formatDateTime } from '@/utils/formatDate'

export default function AuditLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.get('/audit-logs', { params: { limit: 100 } }).then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground text-sm">Track all platform activity and changes</p>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : !data?.data?.length ? (
        <EmptyState icon={FileText} title="No audit logs" description="Activity will appear here as users interact with the platform." />
      ) : (
        <div className="rounded-lg border divide-y">
          {data.data.map((log: ActivityLog) => (
            <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {log.user ? `${log.user.firstName[0]}${log.user.lastName[0]}` : '?'}
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
    </div>
  )
}
