import { Outlet, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useAuthStore } from '@/store/authStore'
import { useSocket } from '@/hooks/useSocket'

export function AdminLayout() {
  const { user, isAuthenticated, isRestoring } = useAuthStore()
  useSocket()

  if (isRestoring) return (
    <div className="flex h-screen items-center justify-center bg-[#0f1117]">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <div className="absolute h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-indigo-400" />
        <Shield className="h-5 w-5 text-indigo-400" />
      </div>
    </div>
  )

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role === 'CLIENT') return <Navigate to="/portal/dashboard" replace />

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#f0f4ff]">
      {/* Dot grid on main content area */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.45]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.22) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Orbs */}
      <motion.div
        className="pointer-events-none fixed top-20 right-40 h-[450px] w-[450px] rounded-full bg-indigo-300/20 blur-3xl z-0"
        animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none fixed bottom-10 right-1/4 h-[350px] w-[350px] rounded-full bg-purple-300/15 blur-3xl z-0"
        animate={{ scale: [1, 1.18, 1], opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />
      <motion.div
        className="pointer-events-none fixed top-1/2 right-10 h-[250px] w-[250px] rounded-full bg-cyan-300/10 blur-3xl z-0"
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <div className="relative z-10 flex h-full w-full">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
