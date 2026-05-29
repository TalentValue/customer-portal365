import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Ticket } from '@/types'
import { TicketCard } from '@/components/tickets/TicketCard'
import { cn } from '@/utils/cn'

interface Props {
  id: string
  label: string
  tickets: Ticket[]
  droppable?: boolean
}

function DraggableTicket({ ticket }: { ticket: Ticket }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ticket.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'opacity-50')}
      {...attributes}
      {...listeners}
    >
      <TicketCard ticket={ticket} />
    </div>
  )
}

export function KanbanColumn({ id, label, tickets, droppable = true }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !droppable })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-72 shrink-0 rounded-xl bg-muted/50 border',
        isOver && droppable && 'border-primary/50 bg-primary/5',
        !droppable && 'opacity-90'
      )}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b">
        <span className="text-sm font-semibold">{label}</span>
        <div className="flex items-center gap-1.5">
          {!droppable && <span className="text-[10px] text-muted-foreground italic">auto-set</span>}
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{tickets.length}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-2 min-h-[200px]">
        {tickets.map((t) => (
          <DraggableTicket key={t.id} ticket={t} />
        ))}
      </div>
    </div>
  )
}
