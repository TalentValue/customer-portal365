import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/services/auth.service'
import { useToast } from '@/hooks/useToast'

const schema = z.object({ email: z.string().email() })

export default function ForgotPassword() {
  const { toast } = useToast()
  const mutation = useMutation({
    mutationFn: ({ email }: { email: string }) => authService.forgotPassword(email),
    onSuccess: () => toast({ title: 'Check your email', description: 'We sent a password reset link if that account exists.' }),
    onError: () => toast({ variant: 'destructive', title: 'Error', description: 'Something went wrong. Try again.' }),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>({ resolver: zodResolver(schema) })

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Forgot password?</h1>
      </div>
      <p className="text-muted-foreground mb-8">Enter your email and we'll send a reset link.</p>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" placeholder="you@example.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send Reset Link
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link to="/login" className="text-primary hover:underline">Back to login</Link>
      </p>
    </div>
  )
}
