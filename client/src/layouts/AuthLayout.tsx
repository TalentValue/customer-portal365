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

const NODES: [number, number][] = [
  [60,50],[200,30],[340,70],[420,180],[340,290],[180,310],[60,220],[220,180],
]
const LINES: [number,number,number,number][] = [
  [60,50,200,30],[200,30,340,70],[340,70,420,180],[420,180,340,290],
  [340,290,180,310],[180,310,60,220],[60,220,60,50],[200,30,220,180],
  [220,180,340,290],[340,70,220,180],
]

export function AuthLayout() {
  const { isAuthenticated, isRestoring, user } = useAuthStore()

  if (isRestoring) return (
    <div className="flex h-screen items-center justify-center bg-[#020818]">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <div className="absolute h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-[#63B3FF]" />
        <Shield className="h-5 w-5 text-[#63B3FF]" />
      </div>
    </div>
  )

  if (isAuthenticated) {
    if (user?.role === 'CLIENT') return <Navigate to="/portal/dashboard" replace />
    return <Navigate to="/admin/dashboard" replace />
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#020818] via-[#060d2e] to-[#0d1f5c]">

      {/* ── AI Background: dot grid ── */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(99,179,255,0.45) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      {/* ── AI Background: neural network SVG ── */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]"
        xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        {LINES.map(([x1,y1,x2,y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#63B3FF" strokeWidth="0.8" strokeOpacity="0.4" strokeDasharray="5 4"
            style={{ animation: `dash-flow ${3 + i * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }} />
        ))}
        {NODES.map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="12" fill="#63B3FF" fillOpacity="0.05" />
            <circle cx={cx} cy={cy} r="3.5" fill="#63B3FF" fillOpacity="0.9"
              style={{ animation: `neural-blink ${2 + i * 0.35}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
            <circle cx={cx} cy={cy} r="7" fill="none" stroke="#63B3FF" strokeWidth="0.7" strokeOpacity="0.35"
              className="pulse-ring" style={{ animationDelay: `${i * 0.25}s` }} />
          </g>
        ))}
      </svg>

      {/* ── AI Background: ambient orbs ── */}
      <motion.div className="pointer-events-none absolute -top-32 -left-20 h-[500px] w-[500px] rounded-full blur-[110px]"
        style={{ background: 'radial-gradient(circle, rgba(99,179,255,0.16) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="pointer-events-none absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full blur-[90px]"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }} />

      {/* ── AI Background: scan beam ── */}
      <div className="hero-v-scan" />

      {/* ── AI Background: particles ── */}
      {[
        { left: '15%', bottom: '20%', size: 3, dur: '5.2s', delay: '0s' },
        { left: '40%', bottom: '10%', size: 2, dur: '6.8s', delay: '1.5s' },
        { left: '70%', bottom: '30%', size: 3, dur: '4.9s', delay: '0.8s' },
        { left: '88%', bottom: '15%', size: 2, dur: '7.2s', delay: '2.2s' },
      ].map((p, i) => (
        <div key={i} className="ai-particle"
          style={{ left: p.left, bottom: p.bottom, width: p.size, height: p.size, animationDuration: p.dur, animationDelay: p.delay }} />
      ))}

      <div className="relative z-10 flex min-h-screen">

        {/* ── Left branding panel ── */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="hidden flex-col justify-between border-r border-white/10 p-12 lg:flex lg:w-5/12 xl:w-1/2"
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#63B3FF]/15 shadow-lg shadow-[#63B3FF]/10 border border-[#63B3FF]/20">
              <Shield className="h-5 w-5 text-[#63B3FF]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Client<span className="text-indigo-400">Portal</span><span className="text-[#63B3FF]">365</span>
            </span>
          </div>

          {/* Middle content */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#63B3FF]/30 bg-[#63B3FF]/10 px-3 py-1.5 text-xs font-semibold text-[#63B3FF]">
                <BrainCircuit className="h-3 w-3" /> AI-Powered Platform
              </div>
              <h2 className="mb-4 text-3xl font-bold leading-snug text-white xl:text-4xl">
                Streamline client<br />
                <span className="text-[#63B3FF]">operations at scale</span>
              </h2>
              <p className="mb-8 text-sm leading-relaxed text-white/55 xl:text-base">
                A unified workspace for onboarding, collaboration, and ticket management — engineered for modern service teams.
              </p>

              <ul className="space-y-3">
                {FEATURES.map((f, i) => (
                  <motion.li key={f}
                    initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                    className="flex items-center gap-2.5 text-sm text-white/75">
                    <CheckCircle className="h-4 w-4 shrink-0 text-[#63B3FF]" />
                    {f}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.6 }}
            className="flex gap-8">
            {[
              { value: '98%', label: 'SLA Score' },
              { value: '24/7', label: 'Always-on' },
              { value: '< 1s', label: 'Email delivery' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-extrabold text-[#63B3FF]">{s.value}</div>
                <div className="text-xs text-white/45">{s.label}</div>
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#63B3FF]/30 bg-[#63B3FF]/15">
                <Shield className="h-4 w-4 text-[#63B3FF]" />
              </div>
              <span className="text-base font-bold text-white">
                Client<span className="text-indigo-400">Portal</span><span className="text-[#63B3FF]">365</span>
              </span>
            </div>

            {/* Form card */}
            <div className="gradient-border-always overflow-hidden rounded-2xl bg-white/95 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
              <Outlet />
            </div>

            <p className="mt-5 text-center text-xs text-white/30">
              © {new Date().getFullYear()} BusinessValue365 · All rights reserved
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
