import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Ticket, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { TicketCard } from '@/components/tickets/TicketCard'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { Pagination } from '@/components/common/Pagination'
import { ticketsService } from '@/services/tickets.service'
import { useToast } from '@/hooks/useToast'

const LIMIT = 20

const requestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['REQUIREMENT_REQUEST', 'FILE_COLLECTION', 'APPROVAL_REQUEST', 'BUG_REPORT', 'SUPPORT_REQUEST', 'GENERAL_TASK', 'FOLLOW_UP']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  description: z.string().optional(),
})
type RequestForm = z.infer<typeof requestSchema>

export default function ClientTickets() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const [page, setPage] = useState(1)
  const [newOpen, setNewOpen] = useState(false)
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['client-tickets', search, status, priority, page],
    queryFn: () => ticketsService.list({
      search,
      status: status === 'all' ? undefined : status,
      priority: priority === 'all' ? undefined : priority,
      page,
      limit: LIMIT,
    } as any).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const form = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: { type: 'SUPPORT_REQUEST', priority: 'MEDIUM' },
  })

  const createMutation = useMutation({
    mutationFn: (values: RequestForm) => ticketsService.create(values as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-tickets'] })
      toast({ title: 'Request submitted successfully' })
      setNewOpen(false)
      form.reset({ type: 'SUPPORT_REQUEST', priority: 'MEDIUM' })
    },
    onError: () => toast({ title: 'Failed to submit request', variant: 'destructive' }),
  })

  const totalPages = Math.ceil((data?.total ?? 0) / LIMIT)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            My <span className="text-gradient-ai">Tickets</span>
          </h1>
          <p className="text-muted-foreground text-sm">{data?.total ?? 0} tickets assigned to you</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setNewOpen(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md shadow-indigo-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="flex gap-3 flex-wrap"
      >
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
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="WAITING_FOR_CLIENT">Waiting for Me</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
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
      </motion.div>

      {isLoading ? (
        <TableSkeleton />
      ) : !data?.data?.length ? (
        <EmptyState icon={Ticket} title="No tickets found" description="Your assigned tickets will appear here." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.data.map((t, i) => <TicketCard key={t.id} ticket={t} showCompany={false} index={i} />)}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Dialog open={newOpen} onOpenChange={(o) => { setNewOpen(o); if (!o) form.reset({ type: 'SUPPORT_REQUEST', priority: 'MEDIUM' }) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit New Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input {...form.register('title')} placeholder="Brief description of the request" />
              {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.watch('type')} onValueChange={(v) => form.setValue('type', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPPORT_REQUEST">Support Request</SelectItem>
                    <SelectItem value="BUG_REPORT">Bug Report</SelectItem>
                    <SelectItem value="REQUIREMENT_REQUEST">Requirement Request</SelectItem>
                    <SelectItem value="FILE_COLLECTION">File Collection</SelectItem>
                    <SelectItem value="APPROVAL_REQUEST">Approval Request</SelectItem>
                    <SelectItem value="GENERAL_TASK">General Task</SelectItem>
                    <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Priority</Label>
                <Select value={form.watch('priority')} onValueChange={(v) => form.setValue('priority', v as any)}>
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
              <Label>Description</Label>
              <Textarea {...form.register('description')} placeholder="Provide additional details..." rows={4} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
