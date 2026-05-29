import { Badge } from '@/components/ui/badge'
import { TicketStatus } from '@/types'

const STATUS_CONFIG: Record<TicketStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' }> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  OPEN: { label: 'Open', variant: 'info' },
  WAITING_FOR_CLIENT: { label: 'Waiting for Client', variant: 'warning' },
  SUBMITTED: { label: 'Submitted', variant: 'info' },
  IN_PROGRESS: { label: 'In Progress', variant: 'default' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CLOSED: { label: 'Closed', variant: 'secondary' },
  OVERDUE: { label: 'Overdue', variant: 'destructive' },
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'secondary' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
