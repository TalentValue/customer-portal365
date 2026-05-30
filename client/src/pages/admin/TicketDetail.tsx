import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, Paperclip, MessageSquare, Lock, Send, Eye, EyeOff,
  Activity, Archive, ArchiveRestore, RefreshCw, Pencil, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/tickets/StatusBadge'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { FileUploader } from '@/components/common/FileUploader'
import { FilePreviewModal } from '@/components/common/FilePreviewModal'
import { RichTextEditor, RichTextDisplay } from '@/components/common/RichTextEditor'
import { TagInput } from '@/components/common/TagInput'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { ticketsService } from '@/services/tickets.service'
import { formatDate, formatRelative } from '@/utils/formatDate'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/useToast'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import api from '@/services/api'

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT:               ['OPEN'],
  OPEN:                ['IN_PROGRESS', 'WAITING_FOR_CLIENT', 'OVERDUE', 'CLOSED'],
  IN_PROGRESS:         ['WAITING_FOR_CLIENT', 'SUBMITTED', 'COMPLETED', 'OVERDUE', 'CLOSED'],
  WAITING_FOR_CLIENT:  ['IN_PROGRESS', 'OVERDUE', 'CLOSED'],
  SUBMITTED:           ['APPROVED', 'REJECTED'],
  APPROVED:            ['COMPLETED'],
  REJECTED:            ['OPEN', 'CLOSED'],
  OVERDUE:             ['IN_PROGRESS', 'CLOSED'],
  COMPLETED:           ['CLOSED'],
  CLOSED:              [],
}

const TICKET_TYPES = [
  { value: 'REQUIREMENT_REQUEST', label: 'Requirement Request' },
  { value: 'FILE_COLLECTION', label: 'File Collection' },
  { value: 'APPROVAL_REQUEST', label: 'Approval Request' },
  { value: 'BUG_REPORT', label: 'Bug Report' },
  { value: 'SUPPORT_REQUEST', label: 'Support Request' },
  { value: 'GENERAL_TASK', label: 'General Task' },
  { value: 'FOLLOW_UP', label: 'Follow Up' },
]

const editSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['REQUIREMENT_REQUEST', 'FILE_COLLECTION', 'APPROVAL_REQUEST', 'BUG_REPORT', 'SUPPORT_REQUEST', 'GENERAL_TASK', 'FOLLOW_UP']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  slaDeadline: z.string().optional(),
})
type EditFormValues = z.infer<typeof editSchema>

interface PreviewFile { url: string; name: string; type: string }

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const isAdmin = user?.role !== 'CLIENT'

  const [comment, setComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [preview, setPreview] = useState<PreviewFile | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editTags, setEditTags] = useState<string[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { title: '', type: 'GENERAL_TASK', priority: 'MEDIUM', description: '', dueDate: '', slaDeadline: '' },
  })

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['tickets', id],
    queryFn: () => ticketsService.get(id!).then((r) => r.data),
  })

  const { data: comments } = useQuery({
    queryKey: ['tickets', id, 'comments'],
    queryFn: () => ticketsService.getComments(id!).then((r) => r.data),
  })

  const { data: attachments } = useQuery({
    queryKey: ['tickets', id, 'attachments'],
    queryFn: () => ticketsService.getAttachments(id!).then((r) => r.data),
  })

  const { data: activity } = useQuery({
    queryKey: ['tickets', id, 'activity'],
    queryFn: () => ticketsService.getActivity(id!).then((r) => r.data),
  })

  const { data: staffData } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
    enabled: isAdmin,
  })

  const { data: teamsData } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api.get('/teams').then((r) => r.data),
    enabled: isAdmin,
  })

  const updateStatus = useMutation({
    mutationFn: (status: string) => ticketsService.updateStatus(id!, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tickets', id] }); toast({ title: 'Status updated' }) },
  })

  const reassign = useMutation({
    mutationFn: (assigneeId: string | undefined) => ticketsService.update(id!, { assigneeId } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tickets', id] }); toast({ title: 'Ticket reassigned' }) },
  })

  const addComment = useMutation({
    mutationFn: () => ticketsService.addComment(id!, comment, isInternal),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tickets', id, 'comments'] }); setComment('') },
  })

  const toggleWatch = useMutation({
    mutationFn: () => ticketsService.watch(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets', id] }),
  })

  const uploadFile = useMutation({
    mutationFn: (file: File) => ticketsService.uploadAttachment(id!, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets', id, 'attachments'] })
      setFiles([])
      toast({ title: 'File uploaded' })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: () => ticketsService.archive(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets', id] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
      toast({ title: ticket?.isArchived ? 'Ticket unarchived' : 'Ticket archived' })
    },
  })

  const reassignTeam = useMutation({
    mutationFn: (teamId: string | undefined) => ticketsService.update(id!, { teamId } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tickets', id] }); toast({ title: 'Team updated' }) },
  })

  const editMutation = useMutation({
    mutationFn: (values: EditFormValues) =>
      ticketsService.update(id!, {
        title: values.title,
        type: values.type as any,
        priority: values.priority as any,
        description: values.description || undefined,
        dueDate: values.dueDate || undefined,
        slaDeadline: values.slaDeadline || undefined,
        tags: editTags,
      } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets', id] })
      setEditOpen(false)
      toast({ title: 'Ticket updated' })
    },
    onError: () => toast({ title: 'Failed to update ticket', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => ticketsService.delete(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      toast({ title: 'Ticket deleted' })
      navigate(isAdmin ? '/admin/tickets' : '/portal/tickets')
    },
    onError: () => toast({ title: 'Failed to delete ticket', variant: 'destructive' }),
  })

  if (isLoading || !ticket) return <PageSkeleton />

  const isWatching = ticket.watchers?.some((w: any) => w.userId === user?.id)

  const openEdit = () => {
    editForm.reset({
      title: ticket.title,
      type: ticket.type,
      priority: ticket.priority,
      description: ticket.description ?? '',
      dueDate: ticket.dueDate ? ticket.dueDate.split('T')[0] : '',
      slaDeadline: ticket.slaDeadline ? ticket.slaDeadline.split('T')[0] : '',
    })
    setEditTags(ticket.tags ?? [])
    setEditOpen(true)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {ticket.isArchived && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 px-4 py-2 text-sm text-yellow-800 dark:text-yellow-200">
          <Archive className="h-4 w-4 shrink-0" />
          This ticket is archived.
        </div>
      )}

      {preview && (
        <FilePreviewModal
          fileUrl={preview.url}
          fileName={preview.name}
          fileType={preview.type}
          onClose={() => setPreview(null)}
        />
      )}

      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{ticket.title}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <Badge variant="outline">{ticket.type.replace(/_/g, ' ')}</Badge>
            {ticket.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => toggleWatch.mutate()} disabled={toggleWatch.isPending}>
            {isWatching ? <EyeOff className="h-3.5 w-3.5 mr-1.5" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
            {isWatching ? 'Unwatch' : 'Watch'}
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={openEdit}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending}>
                {ticket.isArchived
                  ? <><ArchiveRestore className="h-3.5 w-3.5 mr-1.5" />Unarchive</>
                  : <><Archive className="h-3.5 w-3.5 mr-1.5" />Archive</>}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
              </Button>
              <Select value={ticket.status} onValueChange={(v) => updateStatus.mutate(v)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ticket.status}>{ticket.status.replace(/_/g, ' ')}</SelectItem>
                  {(VALID_TRANSITIONS[ticket.status] ?? []).map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {ticket.description && (
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-2">Description</h3>
              {ticket.description.startsWith('<') ? (
                <RichTextDisplay html={ticket.description} />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
              )}
            </div>
          )}

          {isAdmin && ticket.type === 'APPROVAL_REQUEST' && ticket.status === 'SUBMITTED' && (
            <div className="flex items-center gap-2 rounded-lg border p-3 bg-muted/30">
              <span className="text-sm font-medium flex-1">Approval required</span>
              <Button size="sm" variant="outline" className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => updateStatus.mutate('REJECTED')} disabled={updateStatus.isPending}>
                Reject
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => updateStatus.mutate('APPROVED')} disabled={updateStatus.isPending}>
                Approve
              </Button>
            </div>
          )}

          <Tabs defaultValue="comments">
            <TabsList>
              <TabsTrigger value="comments">
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                Comments ({comments?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="files">
                <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                Files ({attachments?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Activity className="h-3.5 w-3.5 mr-1.5" />
                Activity ({activity?.length ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="space-y-4">
              <div className="space-y-3">
                {comments?.map((c: any) => (
                  <div key={c.id} className={`rounded-lg border p-3 ${c.isInternal ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{c.author.firstName[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{c.author.firstName} {c.author.lastName}</span>
                      {c.isInternal && <Lock className="h-3 w-3 text-yellow-600" />}
                      <span className="text-xs text-muted-foreground ml-auto">{formatRelative(c.createdAt)}</span>
                    </div>
                    {c.body.startsWith('<') ? (
                      <RichTextDisplay html={c.body} />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <RichTextEditor value={comment} onChange={setComment} placeholder="Add a comment..." users={staffData ?? []} />
                <div className="flex items-center justify-between">
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <Switch id="internal" checked={isInternal} onCheckedChange={setIsInternal} />
                      <Label htmlFor="internal" className="text-xs">Internal note</Label>
                    </div>
                  )}
                  <Button size="sm" className="ml-auto"
                    disabled={!comment.trim() || comment === '<p></p>' || addComment.isPending}
                    onClick={() => addComment.mutate()}>
                    <Send className="h-3.5 w-3.5 mr-1.5" /> Post
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              <div className="space-y-2">
                {attachments?.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                    <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                    <button className="flex-1 truncate hover:underline text-primary text-left"
                      onClick={() => setPreview({ url: a.fileUrl, name: a.fileName, type: a.fileType })}>
                      {a.fileName}
                    </button>
                    <span className="text-xs text-muted-foreground">{formatRelative(a.createdAt)}</span>
                  </div>
                ))}
              </div>
              <FileUploader onFilesSelected={setFiles} />
              {files.length > 0 && (
                <Button size="sm" onClick={() => files.forEach((f) => uploadFile.mutate(f))} disabled={uploadFile.isPending}>
                  Upload {files.length} file{files.length > 1 ? 's' : ''}
                </Button>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-2 mt-4">
              {!activity?.length ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : activity.map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">{a.user ? `${a.user.firstName} ${a.user.lastName}` : 'System'}</span>
                    {' '}<span className="text-muted-foreground">{a.action.replace(/_/g, ' ').toLowerCase()}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{formatRelative(a.createdAt)}</span>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 text-sm">
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Details</h3>
            <Separator />

            {ticket.company && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company</span>
                <span className="font-medium">{ticket.company.name}</span>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Assigned to</span>
              {isAdmin ? (
                <Select value={ticket.assigneeId ?? 'none'} onValueChange={(v) => reassign.mutate(v === 'none' ? undefined : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {staffData?.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <div className="font-medium">
                  {ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : 'Unassigned'}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Team</span>
              {isAdmin ? (
                <Select value={(ticket as any).teamId ?? 'none'} onValueChange={(v) => reassignTeam.mutate(v === 'none' ? undefined : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="No team" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No team</SelectItem>
                    {teamsData?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <div className="font-medium">{(ticket as any).team?.name ?? 'No team'}</div>
              )}
            </div>

            {ticket.dueDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due date</span>
                <span className="font-medium">{formatDate(ticket.dueDate)}</span>
              </div>
            )}
            {ticket.slaDeadline && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">SLA Deadline</span>
                <span className={`font-medium ${new Date(ticket.slaDeadline) < new Date() ? 'text-destructive' : ''}`}>
                  {formatDate(ticket.slaDeadline)}
                </span>
              </div>
            )}
            {(ticket as any).isRecurring && (ticket as any).recurrencePattern && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recurrence</span>
                <span className="font-medium flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  {(ticket as any).recurrencePattern.charAt(0) + (ticket as any).recurrencePattern.slice(1).toLowerCase()}
                </span>
              </div>
            )}
            {(ticket as any).parentTicketId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recurring instance</span>
                <span className="font-medium text-xs text-muted-foreground">Yes</span>
              </div>
            )}

            {(ticket.tags?.length ?? 0) > 0 && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground text-xs block mb-1.5">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {ticket.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">{formatRelative(ticket.createdAt)}</span>
            </div>

            {(ticket.watchers?.length ?? 0) > 0 && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground text-xs block mb-1.5">Watchers</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {(ticket.watchers ?? []).map((w: any) => (
                      <Avatar key={w.userId} className="h-6 w-6" title={`${w.user.firstName} ${w.user.lastName}`}>
                        <AvatarFallback className="text-base">{w.user.firstName[0]}{w.user.lastName[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit((v) => editMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit-title">Title *</Label>
              <Input id="edit-title" {...editForm.register('title')} />
              {editForm.formState.errors.title && (
                <p className="text-xs text-destructive">{editForm.formState.errors.title.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={editForm.watch('type')} onValueChange={(v) => editForm.setValue('type', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TICKET_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Priority</Label>
                <Select value={editForm.watch('priority')} onValueChange={(v) => editForm.setValue('priority', v as any)}>
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
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea id="edit-desc" {...editForm.register('description')} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-due">Due Date</Label>
                <Input id="edit-due" type="date" {...editForm.register('dueDate')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-sla">SLA Deadline</Label>
                <Input id="edit-sla" type="date" {...editForm.register('slaDeadline')} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Tags</Label>
              <TagInput value={editTags} onChange={setEditTags} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={editMutation.isPending}>
                {editMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete ticket?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Permanently delete "{ticket.title}" along with all its comments, attachments, and activity. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
