import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { user, isAuthenticated, setUser, setAccessToken, logout } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: ({ data }) => {
      setAccessToken(data.accessToken)
      setUser(data.user)
      const role = data.user.role
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') navigate('/admin/dashboard')
      else navigate('/portal/dashboard')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      logout()
      qc.clear()
      navigate('/login')
    },
  })

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    logout: () => logoutMutation.mutate(),
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
  }
}
