import { useNavigate } from 'react-router-dom'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { Ticket } from '@/types'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS },
})

interface TicketCalendarProps {
  tickets: Ticket[]
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#6366f1',
  LOW: '#22c55e',
}

export function TicketCalendar({ tickets }: TicketCalendarProps) {
  const navigate = useNavigate()

  const events = tickets
    .filter((t) => t.dueDate)
    .map((t) => ({
      id: t.id,
      title: t.title,
      start: new Date(t.dueDate!),
      end: new Date(t.dueDate!),
      resource: t,
    }))

  return (
    <div className="calendar-wrapper" style={{ height: 600 }}>
      <style>{`
        .rbc-calendar { font-family: inherit; color: inherit; background: transparent; }
        .rbc-header { padding: 6px; font-weight: 500; font-size: 0.75rem; border-color: hsl(var(--border)); }
        .rbc-month-view, .rbc-agenda-view, .rbc-time-view { border-color: hsl(var(--border)); }
        .rbc-day-bg + .rbc-day-bg, .rbc-month-row + .rbc-month-row { border-color: hsl(var(--border)); }
        .rbc-off-range-bg { background: hsl(var(--muted) / 0.5); }
        .rbc-today { background: hsl(var(--primary) / 0.05); }
        .rbc-toolbar button { font-size: 0.75rem; padding: 4px 10px; border-radius: 6px; border-color: hsl(var(--border)); color: hsl(var(--foreground)); background: transparent; }
        .rbc-toolbar button:hover { background: hsl(var(--accent)); }
        .rbc-toolbar button.rbc-active { background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-color: hsl(var(--primary)); }
        .rbc-event { border-radius: 4px; font-size: 0.7rem; padding: 1px 4px; }
      `}</style>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="month"
        views={['month', 'agenda']}
        onSelectEvent={(event) => navigate(`/admin/tickets/${event.id}`)}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: PRIORITY_COLORS[(event.resource as Ticket).priority] ?? '#6366f1',
            border: 'none',
          },
        })}
        popup
      />
    </div>
  )
}
