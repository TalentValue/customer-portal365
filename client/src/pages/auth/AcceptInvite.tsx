import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/services/auth.service'
import { useToast } from '@/hooks/useToast'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function AcceptInvite() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const token = params.get('token') ?? ''

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      authService.acceptInvite(token, data.password, data.firstName, data.lastName),
    onSuccess: () => {
      toast({ variant: 'success', title: 'Account created!', description: 'You can now log in.' })
      navigate('/login')
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Invalid or expired invite link.' })
    },
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  if (!token) return (
    <div className="text-center">
      <p className="text-destructive">Invalid invite link. Please contact your administrator.</p>
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Accept Invitation</h1>
      </div>
      <p className="text-muted-foreground mb-8">Set up your account to get started.</p>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input placeholder="John" {...register('firstName')} />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input placeholder="Doe" {...register('lastName')} />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input type="password" placeholder="••••••••" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Confirm Password</Label>
          <Input type="password" placeholder="••••••••" {...register('confirmPassword')} />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>
    </div>
  )
}
