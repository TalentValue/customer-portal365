import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { TagInput } from '@/components/common/TagInput'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { templatesService, TicketTemplate } from '@/services/templates.service'
import { useToast } from '@/hooks/useToast'

const TICKET_TYPES = [
  { value: 'REQUIREMENT_REQUEST', label: 'Requirement Request' },
  { value: 'FILE_COLLECTION', label: 'File Collection' },
  { value: 'APPROVAL_REQUEST', label: 'Approval Request' },
  { value: 'BUG_REPORT', label: 'Bug Report' },
  { value: 'SUPPORT_REQUEST', label: 'Support Request' },
  { value: 'GENERAL_TASK', label: 'General Task' },
  { value: 'FOLLOW_UP', label: 'Follow Up' },
]

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Default title is required'),
  type: z.enum(['REQUIREMENT_REQUEST', 'FILE_COLLECTION', 'APPROVAL_REQUEST', 'BUG_REPORT', 'SUPPORT_REQUEST', 'GENERAL_TASK', 'FOLLOW_UP']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  description: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function Templates() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TicketTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TicketTemplate | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesService.list().then((r) => r.data),
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'GENERAL_TASK', priority: 'MEDIUM' },
  })

  const typeValue = watch('type')
  const priorityValue = watch('priority')

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => templatesService.create({ ...values, tags }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); toast({ title: 'Template created' }); closeDialog() },
    onError: () => toast({ title: 'Failed to create template', variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) => templatesService.update(editing!.id, { ...values, tags }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); toast({ title: 'Template updated' }); closeDialog() },
    onError: () => toast({ title: 'Failed to update template', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templatesService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); toast({ title: 'Template deleted' }); setDeleteTarget(null) },
    onError: () => toast({ title: 'Failed to delete template', variant: 'destructive' }),
  })

  const openCreate = () => {
    reset({ type: 'GENERAL_TASK', priority: 'MEDIUM', name: '', title: '', description: '' })
    setTags([])
    setEditing(null)
    setOpen(true)
  }

  const openEdit = (tpl: TicketTemplate) => {
    reset({
      name: tpl.name,
      title: tpl.title,
      type: tpl.type as FormValues['type'],
      priority: tpl.priority as FormValues['priority'],
      description: tpl.description ?? '',
    })
    setTags(tpl.tags ?? [])
    setEditing(tpl)
    setOpen(true)
  }

  const closeDialog = () => {
    setOpen(false)
    setEditing(null)
    reset()
    setTags([])
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ticket Templates</h1>
          <p className="text-muted-foreground text-sm">{data?.length ?? 0} templates</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Template
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : !data?.length ? (
        <EmptyState
          icon={Copy}
          title="No templates yet"
          description="Create templates to pre-fill ticket fields and speed up ticket creation."
          action={{ label: 'New Template', onClick: openCreate }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((tpl) => (
            <Card key={tpl.id} className="group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{tpl.name}</CardTitle>
                    <CardDescription className="text-xs mt-0.5 truncate">{tpl.title}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(tpl)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(tpl)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{tpl.type.replace(/_/g, ' ')}</Badge>
                  <Badge variant="outline" className="text-xs">{tpl.priority}</Badge>
                </div>
                {tpl.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
                )}
                {(tpl.tags?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tpl.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">{tag}</Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  by {tpl.createdBy ? `${tpl.createdBy.firstName} ${tpl.createdBy.lastName}` : 'Unknown'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Template' : 'New Template'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => editing ? updateMutation.mutate(v) : createMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="tpl-name">Template Name *</Label>
              <Input id="tpl-name" {...register('name')} placeholder="e.g. Bug Report Standard" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="tpl-title">Default Ticket Title *</Label>
              <Input id="tpl-title" {...register('title')} placeholder="e.g. [BUG] Issue with..." />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={typeValue} onValueChange={(v) => setValue('type', v as FormValues['type'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TICKET_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Priority</Label>
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
              <Label htmlFor="tpl-desc">Default Description</Label>
              <Textarea id="tpl-desc" {...register('description')} rows={3} placeholder="Describe the typical steps or requirements..." />
            </div>
            <div className="space-y-1">
              <Label>Default Tags</Label>
              <TagInput value={tags} onChange={setTags} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (editing ? 'Saving...' : 'Creating...') : (editing ? 'Save Changes' : 'Create Template')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete template?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete "{deleteTarget?.name}"? This cannot be undone. Existing tickets created from this template will not be affected.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
