import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserCog, Plus, Mail, Shield, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { useToast } from '@/hooks/useToast'
import api from '@/services/api'
import { useAuthStore } from '@/store/authStore'

interface StaffUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'SUPER_ADMIN' | 'ADMIN'
  avatarUrl?: string
}

const ROLE_META = {
  SUPER_ADMIN: { label: 'Super Admin', icon: Crown, className: 'bg-purple-100 text-purple-700 border-purple-200' },
  ADMIN: { label: 'Admin', icon: Shield, className: 'bg-blue-100 text-blue-700 border-blue-200' },
}

export default function Users() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'SUPER_ADMIN'>('ADMIN')

  const { data: users = [], isLoading } = useQuery<StaffUser[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  })

  const invite = useMutation({
    mutationFn: () => api.post('/auth/invite', { email, role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast({ title: 'Invite sent', description: `${email} will receive an email to set up their account.` })
      setEmail('')
      setRole('ADMIN')
      setInviteOpen(false)
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to send invite',
        description: err?.response?.data?.message ?? 'Please try again.',
        variant: 'destructive',
      })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Users</h1>
          <p className="text-muted-foreground text-sm">Manage admin and super admin accounts</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Invite Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
              <Crown className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.filter((u) => u.role === 'SUPER_ADMIN').length}</p>
              <p className="text-xs text-muted-foreground">Super Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.filter((u) => u.role === 'ADMIN').length}</p>
              <p className="text-xs text-muted-foreground">Admins</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User list */}
      {isLoading ? (
        <TableSkeleton />
      ) : !users.length ? (
        <EmptyState
          icon={UserCog}
          title="No staff users"
          description="Invite admins to manage the platform."
        />
      ) : (
        <div className="rounded-lg border divide-y bg-white">
          {users.map((u) => {
            const meta = ROLE_META[u.role]
            const RoleIcon = meta.icon
            const initials = `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase()
            const isCurrentUser = u.id === user?.id

            return (
              <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                <Avatar className="h-10 w-10 shrink-0">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={initials} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <AvatarFallback
                      className="text-sm font-bold text-white"
                      style={{ background: u.role === 'SUPER_ADMIN' ? 'linear-gradient(135deg,#a855f7,#6366f1)' : 'linear-gradient(135deg,#6366f1,#06b6d4)' }}
                    >
                      {initials}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-800">
                      {u.firstName} {u.lastName}
                    </span>
                    {isCurrentUser && (
                      <Badge variant="outline" className="text-xs text-indigo-600 border-indigo-200">You</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Mail className="h-3 w-3" />
                    {u.email}
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`gap-1 text-xs ${meta.className}`}
                >
                  <RoleIcon className="h-3 w-3" />
                  {meta.label}
                </Badge>
              </div>
            )
          })}
        </div>
      )}

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  {isSuperAdmin && <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              An email with a setup link will be sent to the address above.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button
              onClick={() => invite.mutate()}
              disabled={!email || invite.isPending}
            >
              {invite.isPending ? 'Sending…' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
