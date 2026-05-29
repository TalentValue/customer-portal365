import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, Building2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { Pagination } from '@/components/common/Pagination'
import { companiesService } from '@/services/companies.service'
import { Company } from '@/types'
import { formatDate } from '@/utils/formatDate'
import { useToast } from '@/hooks/useToast'
import api from '@/services/api'

const schema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry: z.string().optional(),
  website: z.string().optional(),
  timezone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']),
  billingStatus: z.string().optional(),
  onboardingStage: z.string().optional(),
  accountManagerId: z.string().optional(),
  notes: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing',
  'Education', 'Real Estate', 'Consulting', 'Media', 'Other',
]

const LIMIT = 20

export default function Companies() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [open, setOpen] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['companies', search, page, sortBy, sortDir],
    queryFn: () => companiesService.list({ search, page, limit: LIMIT, sortBy, sortDir }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const { data: staffData } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
    enabled: open,
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'ACTIVE' },
  })

  const closeDialog = () => {
    setOpen(false)
    reset()
    createMutation.reset()
    setTags([])
    setTagInput('')
    setLogoFile(null)
    setLogoPreview(null)
  }

  const handleLogoChange = (file: File) => {
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        name: values.name,
        status: values.status,
        industry: values.industry || undefined,
        website: values.website || undefined,
        timezone: values.timezone || undefined,
        billingStatus: values.billingStatus || undefined,
        onboardingStage: values.onboardingStage || undefined,
        accountManagerId: values.accountManagerId || undefined,
        notes: values.notes || undefined,
        tags,
      }
      const company = await companiesService.create(payload).then((r) => r.data)

      if (logoFile) {
        await companiesService.uploadLogo(company.id, logoFile)
      }

      return company
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] })
      toast({ title: 'Company created' })
      closeDialog()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create company'
      toast({ title: msg, variant: 'destructive' })
    },
  })

  const statusValue = watch('status')
  const accountManagerValue = watch('accountManagerId')

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput('')
  }

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-muted-foreground text-sm">Manage your client companies</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Add Company
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={`${sortBy}:${sortDir}`} onValueChange={(v) => { const [f, d] = v.split(':'); setSortBy(f); setSortDir(d as 'asc' | 'desc'); setPage(1) }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt:desc">Newest first</SelectItem>
            <SelectItem value="createdAt:asc">Oldest first</SelectItem>
            <SelectItem value="name:asc">Name A–Z</SelectItem>
            <SelectItem value="name:desc">Name Z–A</SelectItem>
            <SelectItem value="status:asc">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : !data?.data?.length ? (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Add your first client company to get started."
          action={{ label: 'Add Company', onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.data.map((company: Company) => (
            <Link key={company.id} to={`/admin/companies/${company.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={company.logo} />
                      <AvatarFallback>{company.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{company.name}</h3>
                      <p className="text-xs text-muted-foreground">{company.industry}</p>
                    </div>
                    <Badge variant={company.status === 'ACTIVE' ? 'success' : 'secondary'}>
                      {company.status}
                    </Badge>
                  </div>
                  {company.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {company.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">{tag}</Badge>
                      ))}
                      {company.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">+{company.tags.length - 3}</Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{company._count?.tickets ?? 0} tickets</span>
                    <span>{company._count?.contacts ?? 0} contacts</span>
                    <span className="ml-auto">Since {formatDate(company.createdAt, 'MMM yyyy')}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil((data?.total ?? 0) / LIMIT)} onPageChange={setPage} />

      <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <Label htmlFor="name">Company Name *</Label>
              <Input id="name" {...register('name')} placeholder="Acme Corp" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            {/* Industry + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Industry</Label>
                <Select onValueChange={(v) => setValue('industry', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((i) => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={statusValue} onValueChange={(v) => setValue('status', v as FormValues['status'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Website + Timezone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="website">Website</Label>
                <Input id="website" {...register('website')} placeholder="https://example.com" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" {...register('timezone')} placeholder="e.g. America/New_York" />
              </div>
            </div>

            {/* Billing Status + Onboarding Stage */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="billingStatus">Billing Status</Label>
                <Input id="billingStatus" {...register('billingStatus')} placeholder="e.g. Active, Trial" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="onboardingStage">Onboarding Stage</Label>
                <Input id="onboardingStage" {...register('onboardingStage')} placeholder="e.g. Phase 1" />
              </div>
            </div>

            {/* Account Manager */}
            <div className="space-y-1">
              <Label>Account Manager</Label>
              <Select
                value={accountManagerValue ?? 'none'}
                onValueChange={(v) => setValue('accountManagerId', v === 'none' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
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

            {/* Tags */}
            <div className="space-y-1">
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
                    <Badge
                      key={t}
                      variant="secondary"
                      className="gap-1 cursor-pointer"
                      onClick={() => removeTag(t)}
                    >
                      {t} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...register('notes')} placeholder="Any additional notes..." rows={3} />
            </div>

            {/* Logo Upload */}
            <div className="space-y-1">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-3">
                <div
                  className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors shrink-0"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    {logoFile ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  {logoFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground h-auto py-0.5"
                      onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                    >
                      <X className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleLogoChange(file)
                  e.target.value = ''
                }}
              />
            </div>

            <Separator />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Company'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
