import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SlidersHorizontal } from 'lucide-react'
import { Ticket, TicketStatus } from '@/types'
import { ticketsService } from '@/services/tickets.service'
import { KanbanColumn } from './KanbanColumn'
import { TicketCard } from '@/components/tickets/TicketCard'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const COLUMNS: { id: TicketStatus; label: string; droppable: boolean }[] = [
  { id: 'OPEN', label: 'Open', droppable: true },
  { id: 'IN_PROGRESS', label: 'In Progress', droppable: true },
  { id: 'WAITING_FOR_CLIENT', label: 'Waiting for Client', droppable: true },
  { id: 'OVERDUE', label: 'Overdue', droppable: false },
  { id: 'COMPLETED', label: 'Completed', droppable: true },
]

export function KanbanBoard({ tickets }: { tickets: Ticket[] }) {
  const qc = useQueryClient()
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [visibleCols, setVisibleCols] = useState<Set<TicketStatus>>(
    new Set(COLUMNS.map((c) => c.id))
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const toggleCol = (id: TicketStatus) => {
    setVisibleCols((prev) => {
      if (prev.size === 1 && prev.has(id)) return prev
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const visibleColumns = COLUMNS.filter((c) => visibleCols.has(c.id))

  const grouped = useMemo(() => {
    const map: Record<string, Ticket[]> = {}
    COLUMNS.forEach((c) => { map[c.id] = [] })
    tickets.forEach((t) => {
      if (map[t.status] !== undefined) map[t.status].push(t)
    })
    return map
  }, [tickets])

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ticketsService.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  })

  const onDragStart = ({ active }: DragStartEvent) => {
    const t = tickets.find((x) => x.id === active.id)
    if (t) setActiveTicket(t)
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTicket(null)
    if (!over) return

    let targetStatus = over.id as TicketStatus
    if (!COLUMNS.find((c) => c.id === targetStatus)) {
      const overTicket = tickets.find((t) => t.id === over.id)
      if (!overTicket) return
      targetStatus = overTicket.status as TicketStatus
    }

    const ticket = tickets.find((t) => t.id === active.id)
    const col = COLUMNS.find((c) => c.id === targetStatus)
    if (ticket && col?.droppable && ticket.status !== targetStatus) {
      updateStatus.mutate({ id: ticket.id, status: targetStatus })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" /> Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COLUMNS.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={visibleCols.has(col.id)}
                onCheckedChange={() => toggleCol(col.id)}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {visibleColumns.map((col) => (
            <SortableContext
              key={col.id}
              items={grouped[col.id]?.map((t) => t.id) ?? []}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn id={col.id} label={col.label} tickets={grouped[col.id] ?? []} droppable={col.droppable} />
            </SortableContext>
          ))}
        </div>
        <DragOverlay>
          {activeTicket && <TicketCard ticket={activeTicket} />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
