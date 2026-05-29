import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useAuthStore } from '@/store/authStore'
import { useSocket } from '@/hooks/useSocket'

export function ClientLayout() {
  const { isAuthenticated, isRestoring, user } = useAuthStore()
  useSocket()

  if (isRestoring) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'CLIENT') return <Navigate to="/admin/dashboard" replace />

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
