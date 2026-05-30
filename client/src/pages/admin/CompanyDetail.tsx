import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Building2, Users, Ticket, ExternalLink, Mail,
  Upload, Globe, Clock, Tag, UserCheck, Paperclip, Activity,
  CheckCircle2, AlertCircle, Bell,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { TicketCard } from '@/components/tickets/TicketCard'
import { companiesService } from '@/services/companies.service'
import { ticketsService } from '@/services/tickets.service'
import { formatDate, formatRelative } from '@/utils/formatDate'
import { useToast } from '@/hooks/useToast'
import { INVITE_STATUS_BADGE } from '@/utils/badgeVariants'
import api from '@/services/api'

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { toast } = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const logoInputRef = useRef<HTMLInputElement>(null)

  const { data: company, isLoading } = useQuery({
    queryKey: ['companies', id],
    queryFn: () => companiesService.get(id!).then((r) => r.data),
  })

  const { data: ticketsData } = useQuery({
    queryKey: ['tickets', 'company', id],
    queryFn: () => ticketsService.list({ companyId: id, limit: 50 }).then((r) => r.data),
  })

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', 'company', id],
    queryFn: () => api.get('/contacts', { params: { companyId: id, limit: 50 } }).then((r) => r.data),
  })

  const { data: activityData } = useQuery({
    queryKey: ['companies', id, 'activity'],
    queryFn: () => companiesService.getActivity(id!).then((r) => r.data),
  })

  const { data: uploadsData } = useQuery({
    queryKey: ['companies', id, 'uploads'],
    queryFn: () => companiesService.getUploads(id!).then((r) => r.data),
  })

  const { data: notificationsData } = useQuery({
    queryKey: ['companies', id, 'notifications'],
    queryFn: () => companiesService.getNotifications(id!).then((r) => r.data),
  })

  const { data: staffData } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
    enabled: editOpen,
  })

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      name: '', industry: '', website: '', timezone: '',
      status: 'ACTIVE', billingStatus: '', onboardingStage: '',
      notes: '', accountManagerId: '',
    },
  })

  const openEdit = () => {
    if (!company) return
    const currentTags = company.tags ?? []
    setTags(currentTags)
    reset({
      name: company.name ?? '',
      industry: company.industry ?? '',
      website: company.website ?? '',
      timezone: company.timezone ?? '',
      status: company.status ?? 'ACTIVE',
      billingStatus: company.billingStatus ?? '',
      onboardingStage: company.onboardingStage ?? '',
      notes: company.notes ?? '',
      accountManagerId: company.accountManagerId ?? '',
    })
    setEditOpen(true)
  }

  const updateMutation = useMutation({
    mutationFn: (values: any) => companiesService.update(id!, { ...values, tags }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies', id] })
      toast({ title: 'Company updated' })
      setEditOpen(false)
    },
    onError: () => toast({ title: 'Failed to update company', variant: 'destructive' }),
  })

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => companiesService.uploadLogo(id!, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies', id] })
      toast({ title: 'Logo updated' })
    },
    onError: () => toast({ title: 'Failed to upload logo', variant: 'destructive' }),
  })

  const inviteMutation = useMutation({
    mutationFn: (contactId: string) => api.post(`/contacts/${contactId}/invite`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts', 'company', id] })
      toast({ title: 'Invite sent' })
    },
    onError: () => toast({ title: 'Failed to send invite', variant: 'destructive' }),
  })

  const statusValue = watch('status')
  const accountManagerValue = watch('accountManagerId')

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput('')
  }

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t))

  if (isLoading || !company) return <PageSkeleton />

  const allTickets = ticketsData?.data ?? []
  const openTickets = allTickets.filter((t: any) =>
    ['OPEN', 'WAITING_FOR_CLIENT', 'IN_PROGRESS', 'SUBMITTED'].includes(t.status)
  )
  const pendingTickets = allTickets.filter((t: any) =>
    ['OPEN', 'WAITING_FOR_CLIENT'].includes(t.status)
  )

  return (
    <div className="space-y-6 max-w-6xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Companies
      </Button>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="relative group">
          <Avatar className="h-20 w-20">
            <AvatarImage src={company.logo} />
            <AvatarFallback className="text-2xl">{company.name[0]}</AvatarFallback>
          </Avatar>
          <button
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => logoInputRef.current?.click()}
            title="Upload logo"
          >
            <Upload className="h-5 w-5 text-white" />
          </button>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) uploadLogoMutation.mutate(file)
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <Badge variant={company.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {company.status}
            </Badge>
            {company.billingStatus && (
              <Badge variant="outline">{company.billingStatus}</Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
            {company.industry && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> {company.industry}
              </span>
            )}
            {company.timezone && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {company.timezone}
              </span>
            )}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline text-primary"
              >
                <Globe className="h-3.5 w-3.5" /> {company.website}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {company.accountManager && (
            <div className="flex items-center gap-2 mt-2 text-sm">
              <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Account manager:</span>
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-base">
                  {company.accountManager.firstName[0]}{company.accountManager.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">
                {company.accountManager.firstName} {company.accountManager.lastName}
              </span>
            </div>
          )}

          {(company.tags ?? []).length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              {(company.tags ?? []).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          {company.onboardingStage && (
            <div className="mt-3 max-w-xs">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Onboarding: {company.onboardingStage}</span>
                <span>{company.completionPercentage ?? 0}%</span>
              </div>
              <Progress value={company.completionPercentage ?? 0} className="h-2" />
            </div>
          )}
        </div>

        <Button variant="outline" onClick={openEdit}>Edit Company</Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Ticket className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{company._count?.tickets ?? 0}</div>
            <div className="text-xs text-muted-foreground">Total Tickets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <div className="text-2xl font-bold">{openTickets.length}</div>
            <div className="text-xs text-muted-foreground">Open Tickets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <div className="text-2xl font-bold">{company._count?.contacts ?? 0}</div>
            <div className="text-xs text-muted-foreground">Contacts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-bold">{formatDate(company.createdAt, 'MMM yyyy')}</div>
            <div className="text-xs text-muted-foreground">Member Since</div>
          </CardContent>
        </Card>
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="tickets">
        <TabsList>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Tasks
            {pendingTickets.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">{pendingTickets.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="uploads">Uploads</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="notifications" className="relative">
            Notifications
            {(notificationsData ?? []).filter((n: any) => !n.isRead).length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {(notificationsData ?? []).filter((n: any) => !n.isRead).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* All Tickets */}
        <TabsContent value="tickets" className="mt-4">
          {allTickets.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allTickets.map((t: any) => <TicketCard key={t.id} ticket={t} showCompany={false} />)}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No tickets for this company.</p>
          )}
        </TabsContent>

        {/* Pending Tasks */}
        <TabsContent value="pending" className="mt-4">
          {pendingTickets.length ? (
            <div className="space-y-2">
              {pendingTickets.map((t: any) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/admin/tickets/${t.id}`)}
                >
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.type.replace(/_/g, ' ')}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">{t.status.replace(/_/g, ' ')}</Badge>
                  {t.dueDate && (
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(t.dueDate)}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No pending tasks.</p>
          )}
        </TabsContent>

        {/* Contacts */}
        <TabsContent value="contacts" className="mt-4">
          {!contactsData?.data?.length ? (
            <p className="text-muted-foreground text-sm">No contacts yet.</p>
          ) : (
            <div className="space-y-2">
              {contactsData.data.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs">{c.firstName[0]}{c.lastName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.email}{c.designation && ` · ${c.designation}`}
                    </p>
                  </div>
                  <Badge variant={INVITE_STATUS_BADGE[c.inviteStatus as keyof typeof INVITE_STATUS_BADGE] ?? 'secondary'} className="text-xs shrink-0">
                    {c.inviteStatus}
                  </Badge>
                  {c.inviteStatus === 'PENDING' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => inviteMutation.mutate(c.id)}
                      disabled={inviteMutation.isPending}
                    >
                      <Mail className="h-3.5 w-3.5 mr-1.5" /> Resend
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Activity Timeline */}
        <TabsContent value="activity" className="mt-4">
          {!activityData?.length ? (
            <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
          ) : (
            <div className="relative space-y-0">
              {activityData.map((log: any, i: number) => (
                <div key={log.id} className="flex gap-3 pb-4">
                  <div className="flex flex-col items-center">
                    <Avatar className="h-7 w-7 shrink-0">
                      {log.user?.avatarUrl && <AvatarImage src={log.user.avatarUrl} />}
                      <AvatarFallback className="text-base">
                        {log.user ? `${log.user.firstName[0]}${log.user.lastName[0]}` : '?'}
                      </AvatarFallback>
                    </Avatar>
                    {i < activityData.length - 1 && (
                      <div className="w-px flex-1 bg-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm">
                      {log.user && (
                        <span className="font-medium">
                          {log.user.firstName} {log.user.lastName}{' '}
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {log.action.toLowerCase().replace(/_/g, ' ')} {log.entityType.toLowerCase()}
                      </span>
                      {log.description && (
                        <span className="text-muted-foreground">: {log.description}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatRelative(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Uploads */}
        <TabsContent value="uploads" className="mt-4">
          {!uploadsData?.length ? (
            <p className="text-muted-foreground text-sm">No uploaded files yet.</p>
          ) : (
            <div className="space-y-2">
              {uploadsData.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <a
                      href={a.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline text-primary truncate block"
                    >
                      {a.fileName}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {a.uploadedBy?.firstName} {a.uploadedBy?.lastName}
                      {a.ticket && (
                        <>
                          {' · '}
                          <button
                            className="hover:underline"
                            onClick={() => navigate(`/admin/tickets/${a.ticket.id}`)}
                          >
                            {a.ticket.title}
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{formatRelative(a.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="mt-4">
          {company.notes ? (
            <p className="text-sm whitespace-pre-wrap">{company.notes}</p>
          ) : (
            <p className="text-muted-foreground text-sm">No notes yet.</p>
          )}
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4">
          {!(notificationsData ?? []).length ? (
            <p className="text-muted-foreground text-sm">No notifications for this company.</p>
          ) : (
            <div className="space-y-2">
              {(notificationsData ?? []).map((n: any) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${!n.isRead ? 'bg-muted/40' : ''}`}
                >
                  <div className="relative mt-0.5">
                    <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
                    {!n.isRead && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.relatedType && (
                        <Badge variant="outline" className="text-xs">{n.relatedType}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                    {n.user && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        → {n.user.firstName} {n.user.lastName}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{formatRelative(n.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Company Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Company</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((v) => updateMutation.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <Label>Company Name *</Label>
                <Input {...register('name')} />
              </div>

              <div className="space-y-1">
                <Label>Industry</Label>
                <Select value={watch('industry') || 'none'} onValueChange={(v) => setValue('industry', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Real Estate">Real Estate</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Logistics">Logistics</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={statusValue} onValueChange={(v) => setValue('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Website</Label>
                <Input {...register('website')} placeholder="https://example.com" />
              </div>
              <div className="space-y-1">
                <Label>Timezone</Label>
                <Input {...register('timezone')} placeholder="e.g. America/New_York" />
              </div>

              <div className="space-y-1">
                <Label>Billing Status</Label>
                <Input {...register('billingStatus')} placeholder="e.g. Active, Trial" />
              </div>
              <div className="space-y-1">
                <Label>Onboarding Stage</Label>
                <Input {...register('onboardingStage')} placeholder="e.g. Phase 1" />
              </div>

              <div className="space-y-1 col-span-2">
                <Label>Account Manager</Label>
                <Select
                  value={accountManagerValue || 'none'}
                  onValueChange={(v) => setValue('accountManagerId', v === 'none' ? '' : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {staffData?.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 col-span-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {tags.map((t) => (
                      <Badge key={t} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeTag(t)}>
                        {t} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1 col-span-2">
                <Label>Notes</Label>
                <Textarea {...register('notes')} rows={3} />
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={company.logo} />
                  <AvatarFallback>{company.name[0]}</AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadLogoMutation.isPending}
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  {uploadLogoMutation.isPending ? 'Uploading...' : 'Upload Logo'}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
