import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { UserPlus, Search, Mail, Phone, Users, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { Pagination } from '@/components/common/Pagination'
import { companiesService } from '@/services/companies.service'
import api from '@/services/api'
import { Contact, Company } from '@/types'
import { useToast } from '@/hooks/useToast'
import { useDebounce } from '@/hooks/useDebounce'
import { INVITE_STATUS_BADGE } from '@/utils/badgeVariants'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  designation: z.string().optional(),
  companyId: z.string().min(1, 'Company is required'),
  isActive: z.boolean(),
})
type FormValues = z.infer<typeof schema>

const LIMIT = 20

export default function Contacts() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const { toast } = useToast()
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', debouncedSearch, page, sortBy, sortDir],
    queryFn: () => api.get('/contacts', { params: { search: debouncedSearch, page, limit: LIMIT, sortBy, sortDir } }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'all'],
    queryFn: () => companiesService.list({ limit: 200 }).then((r) => r.data),
    enabled: open,
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true },
  })

  const companyValue = watch('companyId')
  const isActiveValue = watch('isActive')

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => api.post('/contacts', values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      toast({ title: 'Contact created' })
      setOpen(false)
      reset()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create contact'
      toast({ title: msg, variant: 'destructive' })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-muted-foreground text-sm">All client contacts across companies</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />Add Contact
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Select value={`${sortBy}:${sortDir}`} onValueChange={(v) => { const [f, d] = v.split(':'); setSortBy(f); setSortDir(d as 'asc' | 'desc'); setPage(1) }}>
          <SelectTrigger className="w-48">
            <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt:desc">Newest first</SelectItem>
            <SelectItem value="createdAt:asc">Oldest first</SelectItem>
            <SelectItem value="firstName:asc">First name A–Z</SelectItem>
            <SelectItem value="firstName:desc">First name Z–A</SelectItem>
            <SelectItem value="email:asc">Email A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : !data?.data?.length ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Add contacts to invite clients to the portal."
          action={{ label: 'Add Contact', onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="rounded-lg border divide-y">
          {data.data.map((contact: Contact) => (
            <Link key={contact.id} to={`/admin/contacts/${contact.id}`} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
              <Avatar>
                <AvatarFallback>{contact.firstName[0] ?? '?'}{contact.lastName[0] ?? ''}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                <p className="text-xs text-muted-foreground">{contact.designation} · {contact.company?.name}</p>
              </div>
              <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{contact.email}</span>
                {contact.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{contact.phone}</span>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={contact.isActive ? 'success' : 'secondary'}>
                  {contact.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant={INVITE_STATUS_BADGE[contact.inviteStatus]}>
                  {contact.inviteStatus}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil((data?.total ?? 0) / LIMIT)} onPageChange={setPage} />

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" {...register('firstName')} placeholder="John" />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" {...register('lastName')} placeholder="Doe" />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email')} placeholder="john@example.com" />
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
              <Label>Company *</Label>
              <Select value={companyValue} onValueChange={(v) => setValue('companyId', v, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companiesData?.data?.map((c: Company) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.companyId && <p className="text-xs text-destructive">{errors.companyId.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Active Status</Label>
              <div className="flex items-center gap-3 h-10 rounded-md border px-3">
                <Switch
                  id="isActive"
                  checked={isActiveValue}
                  onCheckedChange={(v) => setValue('isActive', v)}
                />
                <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                  {isActiveValue ? 'Active' : 'Inactive'}
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setOpen(false); reset() }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Adding...' : 'Add Contact'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
