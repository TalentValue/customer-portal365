import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/auth.service'
import { useToast } from '@/hooks/useToast'

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
})
type ProfileForm = z.infer<typeof profileSchema>

const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })
type PwForm = z.infer<typeof pwSchema>

export default function ClientProfile() {
  const { user, setUser } = useAuthStore()
  const { toast } = useToast()
  const [editingProfile, setEditingProfile] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' },
  })

  const profileMutation = useMutation({
    mutationFn: ({ firstName, lastName }: ProfileForm) =>
      authService.updateProfile(firstName, lastName),
    onSuccess: (res) => {
      setUser({ ...user!, firstName: res.data.firstName, lastName: res.data.lastName })
      toast({ title: 'Profile updated' })
      setEditingProfile(false)
    },
    onError: () => toast({ variant: 'destructive', title: 'Failed to update profile' }),
  })

  const pwMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: PwForm) =>
      authService.changePassword(currentPassword, newPassword),
    onSuccess: () => { toast({ title: 'Password updated!' }); pwReset() },
    onError: () => toast({ variant: 'destructive', title: 'Error', description: 'Current password is incorrect.' }),
  })

  const { register: pwRegister, handleSubmit: pwHandleSubmit, formState: { errors: pwErrors }, reset: pwReset } =
    useForm<PwForm>({ resolver: zodResolver(pwSchema) })

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your account details</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-lg">
                {initials}
              </div>
              <div>
                <CardTitle>{user?.firstName} {user?.lastName}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
            {!editingProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  profileForm.reset({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' })
                  setEditingProfile(true)
                }}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingProfile ? (
            <form onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" {...profileForm.register('firstName')} />
                  {profileForm.formState.errors.firstName && (
                    <p className="text-xs text-destructive">{profileForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" {...profileForm.register('lastName')} />
                  {profileForm.formState.errors.lastName && (
                    <p className="text-xs text-destructive">{profileForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email} disabled />
                <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={profileMutation.isPending}>
                  {profileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingProfile(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">First Name</Label>
                <p className="text-sm font-medium">{user?.firstName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Last Name</Label>
                <p className="text-sm font-medium">{user?.lastName}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={pwHandleSubmit((d) => pwMutation.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" {...pwRegister('currentPassword')} />
              {pwErrors.currentPassword && <p className="text-xs text-destructive">{pwErrors.currentPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" {...pwRegister('newPassword')} />
              {pwErrors.newPassword && <p className="text-xs text-destructive">{pwErrors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" {...pwRegister('confirmPassword')} />
              {pwErrors.confirmPassword && <p className="text-xs text-destructive">{pwErrors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={pwMutation.isPending}>
              {pwMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
