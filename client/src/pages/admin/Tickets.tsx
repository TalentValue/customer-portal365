import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, SlidersHorizontal, LayoutList, Kanban, CalendarDays, GanttChart, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { TicketCard } from '@/components/tickets/TicketCard'
import { TagInput } from '@/components/common/TagInput'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { TicketCalendar } from '@/components/tickets/TicketCalendar'
import { TicketTimeline } from '@/components/tickets/TicketTimeline'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { Pagination } from '@/components/common/Pagination'
import { ticketsService } from '@/services/tickets.service'
import { companiesService } from '@/services/companies.service'
import { templatesService } from '@/services/templates.service'
import { Ticket, Company } from '@/types'
import { useToast } from '@/hooks/useToast'
import api from '@/services/api'

type View = 'list' | 'kanban' | 'calendar' | 'timeline'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['REQUIREMENT_REQUEST', 'FILE_COLLECTION', 'APPROVAL_REQUEST', 'BUG_REPORT', 'SUPPORT_REQUEST', 'GENERAL_TASK', 'FOLLOW_UP']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  companyId: z.string().min(1, 'Company is required'),
  assigneeId: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  templateId: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  recurrenceEndDate: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const TICKET_TYPES = [
  { value: 'REQUIREMENT_REQUEST', label: 'Requirement Request' },
  { value: 'FILE_COLLECTION', label: 'File Collection' },
  { value: 'APPROVAL_REQUEST', label: 'Approval Request' },
  { value: 'BUG_REPORT', label: 'Bug Report' },
  { value: 'SUPPORT_REQUEST', label: 'Support Request' },
  { value: 'GENERAL_TASK', label: 'General Task' },
  { value: 'FOLLOW_UP', label: 'Follow Up' },
]

export default function Tickets() {
  const LIMIT = 20
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [priority, setPriority] = useState<string>('all')
  const [view, setView] = useState<View>('list')
  const [showArchived, setShowArchived] = useState(false)
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', search, status, priority, showArchived, page],
    queryFn: () => ticketsService.list({
      search,
      status: status === 'all' ? undefined : status,
      priority: priority === 'all' ? undefined : priority,
      page,
      limit: LIMIT,
      archived: showArchived,
    } as any).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'all'],
    queryFn: () => companiesService.list({ limit: 200 }).then((r) => r.data),
    enabled: open,
  })

  const { data: staffData } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
    enabled: open,
  })

  const { data: templatesData } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesService.list().then((r) => r.data),
    enabled: open,
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM', type: 'GENERAL_TASK', isRecurring: false },
  })

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => ticketsService.create({ ...values, status: 'OPEN', tags } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      toast({ title: 'Ticket created' })
      setOpen(false)
      reset()
      setTags([])
    },
    onError: () => toast({ title: 'Failed to create ticket', variant: 'destructive' }),
  })

  const typeValue = watch('type')
  const priorityValue = watch('priority')
  const companyValue = watch('companyId')
  const assigneeValue = watch('assigneeId')
  const templateValue = watch('templateId')
  const isRecurringValue = watch('isRecurring')
  const recurrenceValue = watch('recurrencePattern')

  const applyTemplate = (templateId: string) => {
    setValue('templateId', templateId)
    const tpl = templatesData?.find((t: any) => t.id === templateId)
    if (tpl) {
      if (tpl.type) setValue('type', tpl.type as FormValues['type'])
      if (tpl.priority) setValue('priority', tpl.priority as FormValues['priority'])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tickets</h1>
          <p className="text-muted-foreground text-sm">{data?.total ?? 0} {showArchived ? 'archived' : 'active'} tickets</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />New Ticket
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tickets..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="WAITING_FOR_CLIENT">Waiting for Client</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(v) => { setPriority(v); setPage(1) }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch id="archived" checked={showArchived} onCheckedChange={setShowArchived} />
          <Label htmlFor="archived" className="text-sm cursor-pointer flex items-center gap-1">
            <Archive className="h-3.5 w-3.5" /> Archived
          </Label>
        </div>
        <div className="flex border rounded-lg overflow-hidden">
          <Button variant={view === 'list' ? 'default' : 'ghost'} size="icon" className="rounded-none" onClick={() => setView('list')} title="List">
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button variant={view === 'kanban' ? 'default' : 'ghost'} size="icon" className="rounded-none" onClick={() => setView('kanban')} title="Kanban">
            <Kanban className="h-4 w-4" />
          </Button>
          <Button variant={view === 'calendar' ? 'default' : 'ghost'} size="icon" className="rounded-none" onClick={() => setView('calendar')} title="Calendar">
            <CalendarDays className="h-4 w-4" />
          </Button>
          <Button variant={view === 'timeline' ? 'default' : 'ghost'} size="icon" className="rounded-none" onClick={() => setView('timeline')} title="Timeline">
            <GanttChart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : !data?.data?.length ? (
        <EmptyState
          icon={SlidersHorizontal}
          title="No tickets found"
          description={showArchived ? 'No archived tickets.' : 'Create your first ticket or adjust your filters.'}
          action={showArchived ? undefined : { label: 'New Ticket', onClick: () => setOpen(true) }}
        />
      ) : view === 'kanban' ? (
        <KanbanBoard tickets={data.data} />
      ) : view === 'calendar' ? (
        <TicketCalendar tickets={data.data} />
      ) : view === 'timeline' ? (
        <TicketTimeline tickets={data.data} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.data.map((ticket: Ticket, i: number) => (
            <TicketCard key={ticket.id} ticket={ticket} index={i} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil((data?.total ?? 0) / LIMIT)} onPageChange={setPage} />

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { reset(); setTags([]) } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Ticket</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
            {/* Template selector */}
            {(templatesData?.length ?? 0) > 0 && (
              <div className="space-y-1">
                <Label>From Template</Label>
                <Select value={templateValue ?? 'none'} onValueChange={(v) => applyTemplate(v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select a template (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template</SelectItem>
                    {templatesData?.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register('title')} placeholder="Brief description of the task" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Type *</Label>
                <Select value={typeValue} onValueChange={(v) => setValue('type', v as FormValues['type'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TICKET_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Priority *</Label>
                <Select value={priorityValue} onValueChange={(v) => setValue('priority', v as FormValues['priority'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Company *</Label>
              <Select value={companyValue} onValueChange={(v) => setValue('companyId', v)}>
                <SelectTrigger><SelectValue placeholder="Select a company" /></SelectTrigger>
                <SelectContent>
                  {companiesData?.data?.map((c: Company) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.companyId && <p className="text-xs text-destructive">{errors.companyId.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Assign To</Label>
              <Select value={assigneeValue ?? 'none'} onValueChange={(v) => setValue('assigneeId', v === 'none' ? undefined : v)}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {staffData?.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} placeholder="Detailed description..." rows={3} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
            </div>

            <div className="space-y-1">
              <Label>Tags</Label>
              <TagInput value={tags} onChange={setTags} />
            </div>

            {/* Recurrence */}
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Recurring Ticket</Label>
                <Switch
                  checked={isRecurringValue ?? false}
                  onCheckedChange={(v) => {
                    setValue('isRecurring', v)
                    if (!v) { setValue('recurrencePattern', undefined); setValue('recurrenceEndDate', '') }
                  }}
                />
              </div>
              {isRecurringValue && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Repeat</Label>
                    <Select value={recurrenceValue ?? 'WEEKLY'} onValueChange={(v) => setValue('recurrencePattern', v as any)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="YEARLY">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End Date</Label>
                    <Input type="date" className="h-8 text-xs" {...register('recurrenceEndDate')} />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); setTags([]) }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
