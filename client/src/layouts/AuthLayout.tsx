import { Outlet, Navigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export function AuthLayout() {
  const { isAuthenticated, isRestoring, user } = useAuthStore()

  // While session restore is in flight, show a neutral spinner so the login
  // form never flashes briefly before the redirect fires.
  if (isRestoring) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )

  if (isAuthenticated) {
    if (user?.role === 'CLIENT') return <Navigate to="/portal/dashboard" replace />
    return <Navigate to="/admin/dashboard" replace />
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary p-12 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <Shield className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">ClientPortal365</span>
        </div>
        <div>
          <blockquote className="text-2xl font-light leading-relaxed mb-6">
            "Streamline client onboarding, centralize communication, and track every requirement — all in one place."
          </blockquote>
          <p className="text-primary-foreground/70 text-sm">BusinessValue365 — Powered by ClientPortal365</p>
        </div>
        <div className="flex gap-8 text-sm text-primary-foreground/70">
          <div><div className="text-3xl font-bold text-primary-foreground">500+</div>Companies onboarded</div>
          <div><div className="text-3xl font-bold text-primary-foreground">98%</div>Client satisfaction</div>
          <div><div className="text-3xl font-bold text-primary-foreground">3x</div>Faster onboarding</div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ClientPortal365</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
