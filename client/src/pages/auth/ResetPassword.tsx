import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/services/auth.service'
import { useToast } from '@/hooks/useToast'

const schema = z.object({
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

type FormData = z.infer<typeof schema>

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const token = params.get('token') ?? ''

  const mutation = useMutation({
    mutationFn: ({ password }: FormData) => authService.resetPassword(token, password),
    onSuccess: () => { toast({ title: 'Password reset!', description: 'You can now log in.' }); navigate('/login') },
    onError: () => toast({ variant: 'destructive', title: 'Error', description: 'Invalid or expired link.' }),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Set new password</h1>
      <p className="text-muted-foreground mb-8">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="space-y-2">
          <Label>New Password</Label>
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
          Reset Password
        </Button>
      </form>
    </div>
  )
}
