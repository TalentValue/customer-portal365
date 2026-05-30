import { Outlet, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const MINI_PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1.5,
  duration: Math.random() * 7 + 5,
  delay: Math.random() * 3,
}))

const FEATURES = [
  'Centralised client onboarding',
  'Real-time ticket management',
  'Automated SLA enforcement',
  'Role-based access control',
]

export function AuthLayout() {
  const { isAuthenticated, isRestoring, user } = useAuthStore()

  if (isRestoring) return (
    <div className="flex h-screen items-center justify-center bg-[#f7f8ff]">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <div className="absolute h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-indigo-500" />
        <Shield className="h-5 w-5 text-indigo-500" />
      </div>
    </div>
  )

  if (isAuthenticated) {
    if (user?.role === 'CLIENT') return <Navigate to="/portal/dashboard" replace />
    return <Navigate to="/admin/dashboard" replace />
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f8ff]">
      {/* Soft aurora */}
      <div
        className="pointer-events-none absolute inset-0 animate-aurora opacity-40"
        style={{
          background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 25%, #ecfeff 50%, #eff6ff 75%, #faf5ff 100%)',
        }}
      />

      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.2) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Orbs */}
      <motion.div
        className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-indigo-200/50 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-purple-200/40 blur-3xl"
        animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      {/* Particles */}
      {MINI_PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="pointer-events-none absolute rounded-full bg-indigo-400/25"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -20, 0], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
        />
      ))}

      <div className="relative z-10 flex min-h-screen">
        {/* ── Left branding panel ── */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="hidden flex-col justify-between bg-gradient-to-br from-indigo-600 to-purple-700 p-12 lg:flex lg:w-5/12 xl:w-1/2"
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shadow-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              ClientPortal<span className="text-cyan-300">365</span>
            </span>
          </div>

          {/* Middle content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white/90">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
                AI-Powered Platform
              </div>
              <h2 className="mb-4 text-3xl font-bold leading-snug text-white xl:text-4xl">
                Streamline client
                <br />
                <span className="text-cyan-300">operations at scale</span>
              </h2>
              <p className="mb-8 text-sm leading-relaxed text-white/70 xl:text-base">
                A unified workspace for onboarding, collaboration, and ticket management — engineered for modern teams.
              </p>

              <ul className="space-y-3">
                {FEATURES.map((f, i) => (
                  <motion.li
                    key={f}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                    className="flex items-center gap-2.5 text-sm text-white/80"
                  >
                    <CheckCircle className="h-4 w-4 shrink-0 text-cyan-300" />
                    {f}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex gap-8"
          >
            {[
              { value: '500+', label: 'Companies' },
              { value: '98%', label: 'Satisfaction' },
              { value: '3×', label: 'Faster' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-extrabold text-white">{s.value}</div>
                <div className="text-xs text-white/60">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Right form panel ── */}
        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-slate-800">
                Client<span className="text-indigo-600">Portal</span>
                <span className="text-cyan-500">365</span>
              </span>
            </div>

            {/* White card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-indigo-100">
              <Outlet />
            </div>

            <p className="mt-5 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} BusinessValue365 · All rights reserved
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
