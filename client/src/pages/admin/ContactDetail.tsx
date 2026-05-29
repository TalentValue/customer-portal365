import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Mail, Send, Shield, Calendar, Trash2, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { TicketCard } from '@/components/tickets/TicketCard'
import { INVITE_STATUS_BADGE } from '@/utils/badgeVariants'
import { formatRelative } from '@/utils/formatDate'
import { useToast } from '@/hooks/useToast'
import { ticketsService } from '@/services/tickets.service'
import api from '@/services/api'
import { useState } from 'react'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  designation: z.string().optional(),
  isActive: z.boolean(),
})
type FormValues = z.infer<typeof schema>

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  CLIENT: 'Client',
}

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { toast } = useToast()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contacts', id],
    queryFn: () => api.get(`/contacts/${id}`).then((r) => r.data),
  })

  const { data: ticketsData } = useQuery({
    queryKey: ['tickets', 'contact', id],
    queryFn: () => ticketsService.list({ limit: 50 } as any).then((r) => r.data),
    enabled: !!contact?.company?.id,
    select: (data) => ({
      ...data,
      data: data.data?.filter((t: any) =>
        t.clientContactId === id || t.assigneeId === contact?.userId
      ),
    }),
  })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', designation: '', isActive: true },
  })

  useEffect(() => {
    if (contact) {
      reset({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone ?? '',
        designation: contact.designation ?? '',
        isActive: contact.isActive,
      })
    }
  }, [contact?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const isActiveValue = watch('isActive')

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) => api.put(`/contacts/${id}`, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts', id] })
      qc.invalidateQueries({ queryKey: ['contacts'] })
      toast({ title: 'Contact updated' })
    },
    onError: (err: any) => {
      toast({ title: err?.response?.data?.message ?? 'Failed to update contact', variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/contacts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      toast({ title: 'Contact deleted' })
      navigate('/admin/contacts')
    },
    onError: (err: any) => {
      toast({ title: err?.response?.data?.message ?? 'Failed to delete contact', variant: 'destructive' })
    },
  })

  const inviteMutation = useMutation({
    mutationFn: () => api.post(`/contacts/${id}/invite`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts', id] })
      toast({ title: 'Invite sent' })
    },
    onError: (err: any) => {
      toast({ title: err?.response?.data?.message ?? 'Failed to send invite', variant: 'destructive' })
    },
  })

  if (isLoading || !contact) return <PageSkeleton />

  const initials = `${contact.firstName[0] ?? '?'}${contact.lastName[0] ?? ''}`
  const contactTickets = ticketsData?.data ?? []

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive hover:bg-destructive/10"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Contact
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{contact.firstName} {contact.lastName}</h1>
          <p className="text-sm text-muted-foreground">
            {contact.designation && `${contact.designation} · `}{contact.company?.name}
          </p>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Contact Info</TabsTrigger>
          <TabsTrigger value="tickets">
            <Ticket className="h-3.5 w-3.5 mr-1.5" />
            Tickets ({contactTickets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Edit form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit((v) => updateMutation.mutate(v))} className="space-y-4 rounded-lg border p-5">
                <h2 className="font-semibold text-sm">Contact Information</h2>
                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" {...register('firstName')} />
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" {...register('lastName')} />
                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...register('phone')} placeholder="+1 555 000 0000" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="designation">Designation</Label>
                    <Input id="designation" {...register('designation')} placeholder="CEO" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Active Status</Label>
                  <div className="flex items-center gap-3 h-10 rounded-md border px-3">
                    <Switch
                      id="isActive"
                      checked={isActiveValue}
                      onCheckedChange={(v) => setValue('isActive', v, { shouldDirty: true })}
                    />
                    <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                      {isActiveValue ? 'Active' : 'Inactive'}
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="font-semibold text-sm">Details</h3>
                <Separator />

                <div className="space-y-2">
                  <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Invitation Status
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={INVITE_STATUS_BADGE[contact.inviteStatus as keyof typeof INVITE_STATUS_BADGE] ?? 'secondary'}>
                      {contact.inviteStatus}
                    </Badge>
                  </div>
                  {contact.inviteStatus !== 'ACCEPTED' && (
                    <Button variant="outline" size="sm" className="w-full mt-1"
                      disabled={inviteMutation.isPending} onClick={() => inviteMutation.mutate()}>
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      {contact.inviteStatus === 'PENDING' ? 'Resend Invite' : 'Send Invite'}
                    </Button>
                  )}
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" /> Portal Role
                  </span>
                  {contact.portalUser ? (
                    <Badge variant="secondary">{ROLE_LABEL[contact.portalUser.role] ?? contact.portalUser.role}</Badge>
                  ) : (
                    <p className="text-xs text-muted-foreground">No portal access</p>
                  )}
                </div>

                {contact.portalUser?.lastLogin && (
                  <>
                    <Separator />
                    <div className="space-y-1.5">
                      <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> Last Login
                      </span>
                      <p className="text-xs font-medium">{formatRelative(contact.portalUser.lastLogin)}</p>
                    </div>
                  </>
                )}

                <Separator />
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Added</span>
                  <span className="font-medium">{formatRelative(contact.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="mt-4">
          {!contactTickets.length ? (
            <p className="text-sm text-muted-foreground">No tickets linked to this contact.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contactTickets.map((t: any) => <TicketCard key={t.id} ticket={t} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete contact?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Permanently delete {contact.firstName} {contact.lastName}? This will also remove their portal access. This cannot be undone.
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
