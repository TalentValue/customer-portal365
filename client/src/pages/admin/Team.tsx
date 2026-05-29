import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Users2, Trash2, UserPlus, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/EmptyState'
import { useToast } from '@/hooks/useToast'
import api from '@/services/api'
import { useAuthStore } from '@/store/authStore'

interface TeamMemberUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  avatarUrl?: string
}
interface TeamMember { teamId: string; userId: string; user: TeamMemberUser }
interface Team { id: string; name: string; createdAt: string; members: TeamMember[] }
interface StaffUser { id: string; firstName: string; lastName: string; email: string; role: string }

export default function Team() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')

  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: () => api.get('/teams').then((r) => r.data),
  })

  const { data: staff = [] } = useQuery<StaffUser[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
    enabled: addMemberOpen,
  })

  const createTeam = useMutation({
    mutationFn: (name: string) => api.post('/teams', { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      toast({ title: 'Team created' })
      setNewName('')
      setCreateOpen(false)
    },
    onError: () => toast({ title: 'Failed to create team', variant: 'destructive' }),
  })

  const deleteTeam = useMutation({
    mutationFn: (id: string) => api.delete(`/teams/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      toast({ title: 'Team deleted' })
      if (selectedTeam) setSelectedTeam(null)
    },
  })

  const addMember = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      api.post(`/teams/${teamId}/members`, { userId }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      setSelectedTeam(res.data)
      setSelectedUserId('')
      setAddMemberOpen(false)
      toast({ title: 'Member added' })
    },
    onError: () => toast({ title: 'Failed to add member', variant: 'destructive' }),
  })

  const removeMember = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      api.delete(`/teams/${teamId}/members/${userId}`),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      setSelectedTeam(res.data)
      toast({ title: 'Member removed' })
    },
  })

  const existingMemberIds = new Set(selectedTeam?.members.map((m) => m.userId) ?? [])
  const availableStaff = staff.filter((u) => !existingMemberIds.has(u.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground text-sm">{teams.length} team{teams.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Team
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map((i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : !teams.length ? (
        <EmptyState icon={Users2} title="No teams yet" description="Create your first team to organise your staff." action={{ label: 'New Team', onClick: () => setCreateOpen(true) }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card
              key={team.id}
              className={`cursor-pointer transition-shadow hover:shadow-md ${selectedTeam?.id === team.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedTeam(team)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{team.name}</CardTitle>
                  {isSuperAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteTeam.mutate(team.id) }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 mb-2">
                  {team.members.slice(0, 5).map((m) => (
                    <Avatar key={m.userId} className="h-7 w-7 ring-2 ring-background -ml-1 first:ml-0">
                      <AvatarFallback className="text-xs">
                        {m.user.firstName[0]}{m.user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {team.members.length > 5 && (
                    <span className="text-xs text-muted-foreground ml-1">+{team.members.length - 5}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{team.members.length} member{team.members.length !== 1 ? 's' : ''}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedTeam && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedTeam.name} — Members</CardTitle>
              <Button size="sm" onClick={() => setAddMemberOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" /> Add Member
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedTeam.members.length ? (
              <p className="text-sm text-muted-foreground">No members yet. Add staff to this team.</p>
            ) : (
              <div className="space-y-2">
                {selectedTeam.members.map((m) => (
                  <div key={m.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{m.user.firstName[0]}{m.user.lastName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.user.firstName} {m.user.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {m.user.role.replace('_', ' ')}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeMember.mutate({ teamId: selectedTeam.id, userId: m.userId })}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Team Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Team</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Team Name</Label>
            <Input
              placeholder="e.g. Onboarding Team"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createTeam.mutate(newName) }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button disabled={!newName.trim() || createTeam.isPending} onClick={() => createTeam.mutate(newName)}>
              {createTeam.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Member to {selectedTeam?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Select Staff Member</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a team member" />
              </SelectTrigger>
              <SelectContent>
                {availableStaff.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!availableStaff.length && <p className="text-xs text-muted-foreground">All staff are already in this team.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button
              disabled={!selectedUserId || addMember.isPending}
              onClick={() => addMember.mutate({ teamId: selectedTeam!.id, userId: selectedUserId })}
            >
              {addMember.isPending ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
