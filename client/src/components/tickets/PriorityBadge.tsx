import { Badge } from '@/components/ui/badge'
import { TicketPriority } from '@/types'
import { AlertCircle, ArrowDown, ArrowUp, Zap } from 'lucide-react'

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; icon: React.ElementType; className: string }> = {
  LOW: { label: 'Low', icon: ArrowDown, className: 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300' },
  MEDIUM: { label: 'Medium', icon: ArrowUp, className: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900 dark:text-blue-300' },
  HIGH: { label: 'High', icon: AlertCircle, className: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900 dark:text-orange-300' },
  URGENT: { label: 'Urgent', icon: Zap, className: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900 dark:text-red-300' },
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const config = PRIORITY_CONFIG[priority]
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}
