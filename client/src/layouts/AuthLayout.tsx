import { Outlet, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, CheckCircle, BrainCircuit, Zap, Globe, TrendingUp, Clock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export function AuthLayout() {
  const { isAuthenticated, isRestoring, user } = useAuthStore()

  if (isRestoring) return (
    <div className="flex h-screen items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #dde9f6, #f3f8fd)' }}>
      <div className="relative flex h-12 w-12 items-center justify-center">
        <div className="absolute h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-blue-500" />
        <Shield className="h-5 w-5 text-blue-500" />
      </div>
    </div>
  )

  if (isAuthenticated) {
    if (user?.role === 'CLIENT') return <Navigate to="/portal/dashboard" replace />
    return <Navigate to="/admin/dashboard" replace />
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_1fr]">

      {/* ══════════════════════════════════
          LEFT  — branding panel
      ══════════════════════════════════ */}
      <div className="relative flex flex-col overflow-hidden border-r border-blue-100 p-12"
        style={{ background: 'linear-gradient(135deg, #dde9f6 0%, #ecf3fb 60%, #f3f8fd 100%)' }}>

        {/* Dotted grid */}
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #bfdbfe 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.45,
          }} />

        {/* ── 3D Shield illustration (absolute, right half of panel) ── */}
        <div className="absolute bottom-[120px] right-[10px] top-[120px] w-[44%] overflow-hidden">

          {/* AI scan beam */}
          <div className="pointer-events-none absolute bottom-0 top-0 z-10 w-[2px]"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(37,99,235,0.75) 40%, rgba(37,99,235,0.75) 60%, transparent 100%)',
              boxShadow: '0 0 12px 4px rgba(37,99,235,0.28)',
              animation: 'v-scan 5s ease-in-out infinite',
            }} />

          {/* Floating particles */}
          {[
            { left: '14%', bottom: '50%', size: 5, dur: '4.5s', delay: '0s'   },
            { left: '72%', bottom: '32%', size: 5, dur: '5.5s', delay: '1.2s' },
            { left: '45%', bottom: '14%', size: 4, dur: '4s',   delay: '2s'   },
            { left: '84%', bottom: '64%', size: 5, dur: '5s',   delay: '0.6s' },
            { left: '28%', bottom: '20%', size: 4, dur: '6s',   delay: '1.8s' },
          ].map((p, i) => (
            <div key={i} className="pointer-events-none absolute z-10 rounded-full"
              style={{
                left: p.left, bottom: p.bottom, width: p.size, height: p.size,
                background: 'radial-gradient(circle, rgba(37,99,235,0.95), rgba(96,165,250,0.5), transparent)',
                boxShadow: '0 0 5px 2px rgba(37,99,235,0.4)',
                animation: 'ai-particle linear infinite',
                animationDuration: p.dur, animationDelay: p.delay,
              }} />
          ))}

          {/* SVG illustration */}
          <svg viewBox="0 0 380 520" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="shf" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#eff6ff"/>
                <stop offset="55%"  stopColor="#dbeafe"/>
                <stop offset="100%" stopColor="#bfdbfe"/>
              </linearGradient>
              <linearGradient id="nln" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#1d4ed8"/>
                <stop offset="100%" stopColor="#93c5fd"/>
              </linearGradient>
              <filter id="glw">
                <feGaussianBlur stdDeviation="8" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Large soft glow behind shield */}
            <ellipse cx="190" cy="210" rx="108" ry="98" fill="rgba(96,165,250,0.22)" filter="url(#glw)"/>

            {/* Bottom isometric platform */}
            <polygon points="190,435 290,390 190,345 90,390"  fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1"/>
            <polygon points="290,390 290,420 190,465 190,435" fill="#60a5fa" stroke="#93c5fd" strokeWidth="1"/>
            <polygon points="90,390  90,420  190,465 190,435" fill="#4f97f0" stroke="#93c5fd" strokeWidth="1"/>

            {/* Top isometric platform */}
            <polygon points="190,395 270,360 190,324 110,360" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1"/>
            <polygon points="270,360 270,392 190,425 190,395" fill="#93c5fd" stroke="#93c5fd" strokeWidth="1"/>
            <polygon points="110,360 110,392 190,425 190,395" fill="#7ab8f8" stroke="#93c5fd" strokeWidth="1"/>

            {/* Shield halo */}
            <ellipse cx="190" cy="200" rx="92" ry="84" fill="rgba(96,165,250,0.30)"/>

            {/* Shield body */}
            <path d="M190 108 L252 132 L252 200 C252 240 228 260 190 268 C152 260 128 240 128 200 L128 132 Z"
              fill="url(#shf)" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round"/>

            {/* Inner dashed ring */}
            <path d="M190 118 L242 140 L242 200 C242 236 220 254 190 261 C160 254 138 236 138 200 L138 140 Z"
              fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeDasharray="6 4"/>

            {/* Check mark */}
            <path d="M174 199 L184 212 L208 186" stroke="white" strokeWidth="4" fill="none"
              strokeLinecap="round" strokeLinejoin="round"/>

            {/* Neural nodes — visible but refined */}
            {([
              [30,  118, 6,   0.85], [336, 106, 5.5, 0.80],
              [14,  272, 5,   0.78], [356, 258, 5.5, 0.80],
              [42,  402, 4.5, 0.72], [340, 386, 5,   0.75],
              [108, 44,  4.5, 0.72], [272, 38,  5,   0.75],
            ] as [number,number,number,number][]).map(([cx, cy, r, op], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r + 11} fill="rgba(37,99,235,0.14)"/>
                <circle cx={cx} cy={cy} r={r + 5}  fill="rgba(37,99,235,0.22)"/>
                <circle cx={cx} cy={cy} r={r} fill="#1d4ed8" opacity={op}
                  style={{ animation: `neural-blink ${2.4 + i * 0.35}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}/>
                <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.65"
                  className="pulse-ring" style={{ animationDelay: `${i * 0.25}s` }}/>
              </g>
            ))}

            {/* Connection lines */}
            {([
              [30,118,  128,148], [336,106, 252,148],
              [14,272,  128,200], [356,258, 252,200],
              [42,402,  128,248], [340,386, 252,248],
              [108,44,  158,108], [272,38,  222,108],
            ] as [number,number,number,number][]).map(([x1,y1,x2,y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="url(#nln)" strokeWidth="1.5" strokeOpacity="0.55" strokeDasharray="6 5"
                style={{ animation: `dash-flow ${3.2 + i * 0.35}s ease-in-out infinite`, animationDelay: `${i * 0.28}s` }}/>
            ))}
          </svg>
        </div>

        {/* ── Text content (left portion, stays clear of illustration) ── */}
        <div className="relative flex flex-1 flex-col">

          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-blue-200 bg-white shadow-sm">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">
              ClientPortal<span className="text-blue-600">365</span>
            </span>
          </div>

          {/* Badge */}
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3.5 py-1.5 text-sm font-medium text-blue-600">
            <BrainCircuit className="h-3.5 w-3.5" /> AI-Powered Platform
          </div>

          {/* Heading — max-w keeps it left of illustration */}
          <h2 className="mb-3 max-w-[52%] text-[2rem] font-extrabold leading-tight tracking-tight text-slate-900">
            Streamline client<br />
            operations <span className="text-blue-600">at scale</span>
          </h2>

          {/* Description */}
          <p className="mb-8 max-w-[50%] text-sm leading-relaxed text-slate-500">
            Unified workspace for onboarding, tickets, and
            collaboration — with AI-driven automation running 24/7.
          </p>

          {/* Features */}
          <ul className="mb-auto max-w-[50%] space-y-3">
            {[
              'Multi-tenant isolation at every layer',
              'SLA auto-escalation every 30 minutes',
              'Real-time Socket.io updates',
              'ZeptoMail transactional emails',
            ].map((f, i) => (
              <motion.li key={f}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.08 }}
                className="flex items-center gap-2.5 text-sm text-slate-700">
                <CheckCircle className="h-4 w-4 shrink-0 text-blue-500" />
                {f}
              </motion.li>
            ))}
          </ul>

          {/* Stats */}
          <div className="mt-8 flex items-center gap-7 border-t border-blue-100 pt-6">
            {[
              { icon: TrendingUp, value: '98%',  label: 'SLA Score'      },
              { icon: Clock,      value: '24/7',  label: 'Always-on'      },
              { icon: Zap,        value: '< 1s',  label: 'Email delivery' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-white shadow-sm">
                  <Icon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-slate-900">{value}</div>
                  <div className="text-[11px] leading-none text-slate-400">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          RIGHT  — form panel
      ══════════════════════════════════ */}
      <div className="flex flex-col items-center justify-center bg-white px-14 py-12">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-blue-200 bg-blue-50">
              <Shield className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              ClientPortal<span className="text-blue-600">365</span>
            </span>
          </div>

          {/* Login.tsx via Outlet — untouched */}
          <Outlet />

          {/* Divider */}
          <div className="mt-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">or continue with</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Trust badge pills */}
          <div className="mt-4 space-y-3">
            <div className="flex cursor-default items-center justify-center gap-2 rounded-full border border-slate-200 bg-white py-3 text-sm text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50">
              <Shield className="h-3.5 w-3.5 text-blue-500" /> JWT + httpOnly cookies
            </div>
            <div className="flex gap-3">
              <div className="flex flex-1 cursor-default items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white py-2.5 text-xs text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50">
                <Zap className="h-3 w-3 text-blue-500" /> Socket.io real-time
              </div>
              <div className="flex flex-1 cursor-default items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white py-2.5 text-xs text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50">
                <Globe className="h-3 w-3 text-blue-500" /> Multi-tenant isolation
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} BusinessValue365 · All rights reserved
          </p>
        </div>
      </div>

    </div>
  )
}
