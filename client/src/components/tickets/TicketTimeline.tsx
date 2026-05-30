import { useNavigate } from 'react-router-dom'
import { Ticket } from '@/types'
import { formatDate } from '@/utils/formatDate'
import { EmptyState } from '@/components/common/EmptyState'
import { CalendarDays } from 'lucide-react'

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-400',
  MEDIUM: 'bg-blue-500',
  LOW: 'bg-green-500',
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86400000)
}

function buildDateHeaders(min: Date, max: Date): { label: string; date: Date }[] {
  const headers: { label: string; date: Date }[] = []
  const current = new Date(min)
  current.setHours(0, 0, 0, 0)
  const end = new Date(max)
  while (current <= end) {
    headers.push({ label: current.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), date: new Date(current) })
    current.setDate(current.getDate() + 1)
  }
  return headers
}

export function TicketTimeline({ tickets }: { tickets: Ticket[] }) {
  const navigate = useNavigate()
  const withDates = tickets.filter((t) => t.dueDate)

  if (!withDates.length) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No tickets with due dates"
        description="Set due dates on tickets to see them on the timeline."
      />
    )
  }

  const allDates = withDates.flatMap((t) => [new Date(t.createdAt), new Date(t.dueDate!)])
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))
  // Pad by 1 day each side for visual breathing room
  const start = addDays(minDate, -1)
  const end = addDays(maxDate, 1)
  const totalMs = end.getTime() - start.getTime()

  const pct = (date: Date) => `${Math.max(0, Math.min(100, ((date.getTime() - start.getTime()) / totalMs) * 100)).toFixed(2)}%`
  const width = (from: Date, to: Date) => `${Math.max(0.5, ((to.getTime() - from.getTime()) / totalMs) * 100).toFixed(2)}%`

  const dayCount = Math.round(totalMs / 86400000)
  // Show a header tick every N days depending on range
  const step = dayCount <= 14 ? 1 : dayCount <= 60 ? 7 : 30
  const headers = buildDateHeaders(start, end).filter((_, i) => i % step === 0)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Date axis */}
        <div className="flex items-center mb-2 ml-48 relative h-6">
          {headers.map(({ label, date }) => (
            <div
              key={date.toISOString()}
              className="absolute text-xs text-muted-foreground"
              style={{ left: pct(date) }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Today line */}
        <div className="relative ml-48">
          <div
            className="absolute top-0 bottom-0 w-px bg-destructive/60 z-10 pointer-events-none"
            style={{ left: pct(new Date()) }}
            title="Today"
          />
        </div>

        {/* Rows */}
        <div className="space-y-1.5">
          {withDates.map((ticket) => {
            const barStart = new Date(ticket.createdAt)
            const barEnd = new Date(ticket.dueDate!)
            const isPast = barEnd < new Date()

            return (
              <div key={ticket.id} className="flex items-center gap-2 group">
                <div
                  className="w-44 shrink-0 text-sm truncate cursor-pointer hover:underline text-right pr-2"
                  onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                  title={ticket.title}
                >
                  {ticket.title}
                </div>
                <div className="flex-1 relative h-7 bg-muted/30 rounded">
                  <div
                    className={`absolute h-full rounded flex items-center px-2 cursor-pointer transition-opacity hover:opacity-80 ${PRIORITY_COLORS[ticket.priority] ?? 'bg-primary'} ${isPast ? 'opacity-60' : ''}`}
                    style={{ left: pct(barStart), width: width(barStart, barEnd) }}
                    onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                    title={`${ticket.title} — due ${formatDate(ticket.dueDate!)}`}
                  >
                    <span className="text-base text-white truncate">{ticket.title}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 ml-48 text-xs text-muted-foreground flex-wrap">
          {Object.entries(PRIORITY_COLORS).map(([p, c]) => (
            <div key={p} className="flex items-center gap-1">
              <div className={`h-2.5 w-2.5 rounded ${c}`} />
              <span>{p.charAt(0) + p.slice(1).toLowerCase()}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-px bg-destructive/60" />
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  )
}
