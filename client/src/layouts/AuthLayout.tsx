import { Outlet, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, CheckCircle, BrainCircuit } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const FEATURES = [
  'Multi-tenant data isolation at every layer',
  'JWT access tokens + httpOnly refresh cookies',
  'SLA auto-escalation every 30 minutes',
  'ZeptoMail transactional emails on every event',
]

export function AuthLayout() {
  const { isAuthenticated, isRestoring, user } = useAuthStore()

  if (isRestoring) return (
    <div className="flex h-screen items-center justify-center bg-[#f0f4ff]">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <div className="absolute h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-indigo-600" />
        <Shield className="h-5 w-5 text-indigo-600" />
      </div>
    </div>
  )

  if (isAuthenticated) {
    if (user?.role === 'CLIENT') return <Navigate to="/portal/dashboard" replace />
    return <Navigate to="/admin/dashboard" replace />
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f0f4ff]">

      {/* ── Light background: subtle dot grid ── */}
      <div className="pointer-events-none absolute inset-0 opacity-40"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.12) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* ── Light background: soft ambient blobs ── */}
      <motion.div className="pointer-events-none absolute -top-24 left-1/4 h-[480px] w-[480px] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="pointer-events-none absolute bottom-0 right-1/3 h-[380px] w-[380px] rounded-full blur-[100px]"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 4 }} />

      <div className="relative z-10 flex min-h-screen">

        {/* ── Left branding panel ── */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1e3a8a] via-[#1d4ed8] to-[#0ea5e9] p-12 lg:flex lg:w-5/12 xl:w-1/2"
        >
          {/* Panel decorative rings */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-8  -top-8  h-48 w-48 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full border border-white/8" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-56 w-56 rounded-full border border-white/8" />

          {/* Panel grid texture */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

          {/* Panel inner glow */}
          <div className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)' }} />

          {/* Logo */}
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 shadow-lg backdrop-blur-sm">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Client<span className="text-blue-200">Portal</span><span className="text-cyan-300">365</span>
            </span>
          </div>

          {/* Middle content */}
          <div className="relative">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
                <BrainCircuit className="h-3 w-3" /> AI-Powered Platform
              </div>
              <h2 className="mb-4 text-3xl font-bold leading-snug text-white xl:text-4xl">
                Streamline client<br />
                <span className="text-cyan-300">operations at scale</span>
              </h2>
              <p className="mb-8 text-sm leading-relaxed text-white/65 xl:text-base">
                A unified workspace for onboarding, collaboration, and ticket management — engineered for modern service teams.
              </p>

              <ul className="space-y-3">
                {FEATURES.map((f, i) => (
                  <motion.li key={f}
                    initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                    className="flex items-center gap-2.5 text-sm text-white/80">
                    <CheckCircle className="h-4 w-4 shrink-0 text-cyan-300" />
                    {f}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.6 }}
            className="relative flex gap-8">
            {[
              { value: '98%', label: 'SLA Score' },
              { value: '24/7', label: 'Always-on' },
              { value: '< 1s', label: 'Email delivery' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-extrabold text-white">{s.value}</div>
                <div className="text-xs text-white/50">{s.label}</div>
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 shadow-md">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-slate-800">
                Client<span className="text-indigo-600">Portal</span><span className="text-blue-500">365</span>
              </span>
            </div>

            {/* Form card */}
            <div className="rounded-2xl border border-indigo-100 bg-white p-8 shadow-xl shadow-indigo-100/60">
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
