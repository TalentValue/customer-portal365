import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Plus, Trash2, Power, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { useToast } from '@/hooks/useToast'
import api from '@/services/api'

interface ReminderTicket { id: string; title: string; status: string }
interface ReminderCompany { id: string; name: string }
interface Reminder {
  id: string
  ticketId: string
  companyId: string
  frequency: number
  isActive: boolean
  lastSentAt?: string
  createdAt: string
  ticket: ReminderTicket
  company: ReminderCompany
}
interface Ticket { id: string; title: string; companyId: string; company?: { name: string } }
interface Company { id: string; name: string }

const FREQUENCY_OPTIONS = [
  { label: 'Every 1 hour', value: '1' },
  { label: 'Every 4 hours', value: '4' },
  { label: 'Every 8 hours', value: '8' },
  { label: 'Every 24 hours', value: '24' },
  { label: 'Every 48 hours', value: '48' },
  { label: 'Every 72 hours', value: '72' },
]

export default function Reminders() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [ticketId, setTicketId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [frequency, setFrequency] = useState('24')

  const { data: reminders = [], isLoading } = useQuery<Reminder[]>({
    queryKey: ['reminders'],
    queryFn: () => api.get('/reminders').then((r) => r.data),
  })

  const { data: tickets = [] } = useQuery<Ticket[]>({
    queryKey: ['tickets-simple'],
    queryFn: () => api.get('/tickets').then((r) => r.data?.data ?? r.data),
    enabled: createOpen,
  })

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies-simple'],
    queryFn: () => api.get('/companies').then((r) => r.data?.data ?? r.data),
    enabled: createOpen,
  })

  const create = useMutation({
    mutationFn: () => api.post('/reminders', { ticketId, companyId, frequency: Number(frequency) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] })
      toast({ title: 'Reminder created' })
      setTicketId(''); setCompanyId(''); setFrequency('24')
      setCreateOpen(false)
    },
    onError: () => toast({ title: 'Failed to create reminder', variant: 'destructive' }),
  })

  const toggle = useMutation({
    mutationFn: (id: string) => api.patch(`/reminders/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
    onError: () => toast({ title: 'Failed to update reminder', variant: 'destructive' }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/reminders/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] })
      toast({ title: 'Reminder deleted' })
    },
    onError: () => toast({ title: 'Failed to delete reminder', variant: 'destructive' }),
  })

  const activeCount = reminders.filter((r) => r.isActive).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reminders</h1>
          <p className="text-muted-foreground text-sm">Automated email reminders for open tickets</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Reminder
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <Power className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active reminders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Bell className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reminders.length}</p>
              <p className="text-xs text-muted-foreground">Total reminders</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {isLoading ? (
        <TableSkeleton />
      ) : !reminders.length ? (
        <EmptyState
          icon={Bell}
          title="No reminders"
          description="Create a reminder to automatically email clients about open tickets."
        />
      ) : (
        <div className="rounded-lg border divide-y bg-white">
          {reminders.map((r) => (
            <div key={r.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${r.isActive ? 'bg-green-100' : 'bg-slate-100'}`}>
                <Bell className={`h-4 w-4 ${r.isActive ? 'text-green-600' : 'text-slate-400'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{r.ticket.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">{r.company.name}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Every {r.frequency}h
                  </span>
                  {r.lastSentAt && (
                    <>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        Last sent {new Date(r.lastSentAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <Badge variant="outline" className={r.isActive ? 'text-green-600 border-green-200 bg-green-50' : 'text-slate-400'}>
                {r.isActive ? 'Active' : 'Paused'}
              </Badge>

              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title={r.isActive ? 'Pause' : 'Resume'}
                  onClick={() => toggle.mutate(r.id)}
                >
                  <Power className={`h-4 w-4 ${r.isActive ? 'text-green-500' : 'text-slate-400'}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:text-destructive"
                  title="Delete"
                  onClick={() => remove.mutate(r.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Reminder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Select value={companyId} onValueChange={(v) => { setCompanyId(v); setTicketId('') }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company…" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ticket</Label>
              <Select value={ticketId} onValueChange={setTicketId} disabled={!companyId}>
                <SelectTrigger>
                  <SelectValue placeholder={companyId ? 'Select ticket…' : 'Select a company first'} />
                </SelectTrigger>
                <SelectContent>
                  {tickets
                    .filter((t) => t.companyId === companyId)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              The client contact linked to the selected ticket will receive an email at this frequency until the ticket is resolved.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => create.mutate()}
              disabled={!ticketId || !companyId || create.isPending}
            >
              {create.isPending ? 'Creating…' : 'Create Reminder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
