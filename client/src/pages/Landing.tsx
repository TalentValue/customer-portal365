import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import {
  Shield, Ticket, Zap, BarChart3, ArrowRight, CheckCircle,
  Globe, Lock, Sparkles, Users, TrendingUp,
  Bell, BrainCircuit, Workflow, ChevronRight, GitBranch, Bot,
  Cloud, FileText, Clock, UserCheck, Settings, Kanban,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const FEATURES = [
  {
    icon: Ticket,
    title: 'Smart Ticket Management',
    desc: 'Full ticket lifecycle from submission to resolution — with priority levels, SLA auto-tracking, and a Kanban board view.',
    items: ['OPEN → IN_PROGRESS → RESOLVED → CLOSED', 'Priority: URGENT / HIGH / MEDIUM / LOW', 'SLA deadlines tracked automatically', 'Kanban board + list view'],
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    icon: Zap,
    title: 'Real-time Collaboration',
    desc: 'Socket.io powers live ticket updates, rich text comments, and presence indicators so nothing gets missed.',
    items: ['Socket.io live updates (no refresh needed)', 'Rich text comments on every ticket', 'File attachments: PDF, DOCX, ZIP, images, MP4', 'Internal comments (Admin-only visibility)'],
    gradient: 'from-purple-500 to-violet-500',
  },
  {
    icon: UserCheck,
    title: 'Client Self-Service Portal',
    desc: 'Clients get their own branded portal to submit tickets, track status, upload files, and manage notification preferences.',
    items: ['Submit & track tickets in real time', 'Upload attachments per ticket', 'Control notification preferences', 'View full ticket history'],
    gradient: 'from-cyan-500 to-teal-500',
  },
  {
    icon: Shield,
    title: 'Role-Based Access Control',
    desc: 'Three-tier RBAC keeps your data isolated. SuperAdmin manages the platform, Admins manage their company, Clients see only their tickets.',
    items: ['SuperAdmin — full platform access', 'Admin — scoped to their company', 'Client — own tickets & portal only', 'JWT access tokens + httpOnly refresh cookies'],
    gradient: 'from-[#63B3FF] to-[#93C5FD]',
  },
  {
    icon: Clock,
    title: 'Automated Workflows',
    desc: 'Three scheduled jobs run silently in the background so your SLAs never slip and your inbox stays clean.',
    items: ['SLA escalation job — every 30 minutes', 'Reminder email job — every hour', 'Auto-close inactive tickets — daily midnight', 'Email delivery via Resend SDK'],
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    icon: Cloud,
    title: 'PWA & File Storage',
    desc: 'Installable Progressive Web App with offline caching and Supabase-backed file storage for all attachments.',
    items: ['Installable PWA (desktop & mobile)', 'Offline dashboard + ticket list (NetworkFirst)', 'Supabase Storage for all file uploads', 'Push notifications on new activity'],
    gradient: 'from-sky-500 to-blue-500',
  },
]

const ROLES = [
  {
    role: 'SuperAdmin',
    icon: Settings,
    color: 'bg-indigo-600',
    border: 'border-indigo-200',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    desc: 'Full platform access. Manages all companies, users, settings, and system-wide configuration.',
    caps: ['Manage all companies & tenants', 'Impersonate any company', 'Global settings & email templates', 'Platform-wide analytics'],
  },
  {
    role: 'Admin',
    icon: Users,
    color: 'bg-purple-600',
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    desc: 'Agency staff. Manages tickets, teams, and clients within their own company scope.',
    caps: ['Create & assign tickets', 'Manage team members', 'View company analytics', 'Set SLA targets & reminders'],
  },
  {
    role: 'Client',
    icon: UserCheck,
    color: 'bg-[#63B3FF]',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    desc: 'End clients. Submit requests, track their own tickets, upload files, and receive real-time updates.',
    caps: ['Submit & track own tickets', 'Upload files per ticket', 'Real-time status notifications', 'Manage notification preferences'],
  },
]

const STEPS = [
  {
    num: '01', icon: Users, title: 'Set Up Your Workspace',
    desc: 'Create your company, invite your team as Admins, and configure SLA targets. Done in under 5 minutes.',
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    num: '02', icon: FileText, title: 'Invite Your Clients',
    desc: 'Send a one-link invitation. Clients self-register, access their portal, and start submitting tickets immediately.',
    gradient: 'from-purple-500 to-violet-500',
  },
  {
    num: '03', icon: TrendingUp, title: 'Collaborate & Resolve',
    desc: 'Tickets auto-route, SLAs track in real time, and both your team and clients get Socket.io live updates at every step.',
    gradient: 'from-[#63B3FF] to-[#93C5FD]',
  },
]

const ACTIVE_WORKFLOWS = [
  { label: 'SLA Escalation Job — every 30 min', dot: 'bg-emerald-400' },
  { label: 'Reminder Email Job — every 1 hour', dot: 'bg-[#63B3FF]' },
  { label: 'Auto-Close Inactive Tickets — daily midnight', dot: 'bg-emerald-400' },
  { label: 'Socket.io Ticket Updates — live', dot: 'bg-emerald-400' },
  { label: 'Email Queue via Resend SDK — processing', dot: 'bg-amber-400' },
]

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 55, damping: 18 })
  const [display, setDisplay] = useState(0)
  useEffect(() => { if (inView) motionVal.set(target) }, [inView, motionVal, target])
  useEffect(() => spring.on('change', (v) => setDisplay(Math.round(v))), [spring])
  return <span ref={ref}>{display}{suffix}</span>
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const fade = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export default function Landing() {
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const [tipIndex, setTipIndex] = useState(0)

  const TIPS = [
    'Tickets auto-assign to the right team member instantly',
    'SLA deadlines tracked automatically — no manual timers',
    'Clients see live ticket updates without ever refreshing',
    'Escalation job runs every 30 min to prevent SLA breaches',
  ]

  useEffect(() => {
    if (isAuthenticated)
      navigate(user?.role === 'CLIENT' ? '/portal/dashboard' : '/admin/dashboard', { replace: true })
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    const id = setInterval(() => setTipIndex((p) => (p + 1) % TIPS.length), 3400)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-800">

      {/* ── Navbar ── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-50 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 shadow-sm md:px-14"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-md shadow-indigo-200/50">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Client<span className="text-indigo-600">Portal</span><span className="text-[#63B3FF]">365</span>
          </span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          {[
            { label: 'Features', href: '#features' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'User Roles', href: '#roles' },
            { label: 'Sign In', href: '/login' },
          ].map((item) => (
            <a key={item.label} href={item.href}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600">
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600 sm:block">
            Sign In
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200/60 transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-300/50"
          >
            Get Started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#060d2e] via-[#0f1e5e] to-[#1a3a9f]">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        <div className="pointer-events-none absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-indigo-600/20 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32 lg:flex lg:items-center lg:gap-16">

          {/* Left copy */}
          <div className="flex-1 lg:max-w-[580px]">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/80 backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#63B3FF]" />
              Multi-tenant SaaS · Built by BusinessValue365
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 text-5xl font-extrabold leading-[1.08] tracking-tight text-white md:text-6xl lg:text-[64px]"
            >
              The Client Portal Built for{' '}
              <span className="text-[#63B3FF]">Service Teams</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mb-6 flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
            >
              <BrainCircuit className="h-4 w-4 shrink-0 text-[#63B3FF]" />
              <div className="h-5 overflow-hidden flex-1">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={tipIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm font-medium text-white/85"
                  >
                    {TIPS[tipIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 }}
              className="mb-10 text-base leading-relaxed text-white/65 md:text-lg"
            >
              Give every client a portal to submit tickets, track progress, and collaborate in real time.
              Your team gets automated SLA tracking, smart routing, live dashboards, and
              scheduled jobs that work 24/7 — so nothing ever slips through the cracks.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.46 }}
              className="flex flex-wrap gap-4"
            >
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: '0 16px 48px -8px rgba(99,179,255,0.45)' }}
                  whileTap={{ scale: 0.97 }}
                  className="beam-sweep flex items-center gap-2 rounded-xl bg-[#63B3FF] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#63B3FF]/30 transition-all hover:bg-[#4DA8FF]"
                >
                  Enter Portal <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
              <motion.a
                href="#features"
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Explore Features <ChevronRight className="h-3.5 w-3.5" />
              </motion.a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.62 }}
              className="mt-8 flex flex-wrap gap-6 text-sm text-white/50"
            >
              {[
                { icon: CheckCircle, text: 'JWT + Refresh Tokens' },
                { icon: Lock, text: 'Role-Based Access Control' },
                { icon: Globe, text: 'Multi-tenant Isolation' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-[#63B3FF]" /> {text}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: stats card + terminal */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.42, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-16 flex-1 lg:mt-0"
          >
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="absolute -top-5 right-4 z-10 flex items-center gap-2 rounded-full border border-white/20 bg-[#0a1540]/90 px-4 py-2 shadow-xl backdrop-blur-sm"
            >
              <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-white/90">Platform Live · All Systems Nominal</span>
            </motion.div>

            <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#0a1540]/80 p-6 shadow-2xl backdrop-blur-sm">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-white/50">Portal at a Glance</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> LIVE
                </span>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-3">
                {[
                  { val: 3, suffix: '', label: 'User Roles' },
                  { val: 18, suffix: '', label: 'DB Models' },
                  { val: 98, suffix: '%', label: 'SLA Score' },
                  { val: 3, suffix: '', label: 'Cron Jobs' },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="text-3xl font-extrabold text-[#63B3FF]">
                      <AnimatedCounter target={s.val} suffix={s.suffix} />
                    </div>
                    <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-white/45">{s.label}</div>
                  </motion.div>
                ))}
              </div>

              <div className="rounded-xl border border-white/10 bg-[#060d26] p-4">
                <div className="mb-3 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs text-white/30">system.log</span>
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  <p className="text-white/40">$ sla-escalation <span className="text-[#63B3FF]">every 30min</span> <span className="text-emerald-400">✓ active</span><span className="animate-pulse text-white">▌</span></p>
                  <p className="text-white/30">$ reminder-job <span className="text-emerald-400">every 1h running</span></p>
                  <p className="text-white/30">$ auto-close <span className="text-amber-400">midnight scheduled</span></p>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
            >
              <Shield className="h-4 w-4 text-[#63B3FF]" />
              <span className="text-sm font-semibold text-white/80">A BusinessValue365 Product</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <motion.section
        id="features"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        className="mx-auto max-w-6xl px-6 py-24"
      >
        <motion.div variants={fade} className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
            <Sparkles className="h-3 w-3" /> Platform Capabilities
          </div>
          <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            Every Feature Your Agency Needs
            <br />
            <span className="text-indigo-600">Built In & Production-Ready</span>
          </h2>
          <p className="mx-auto max-w-lg text-base text-slate-500">
            From the first ticket submitted to the final resolution — every step handled intelligently,
            in real time, with full audit trail.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                variants={fade}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50"
              >
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} shadow-md`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-base font-bold text-slate-800">{f.title}</h3>
                <p className="mb-5 text-sm leading-relaxed text-slate-500">{f.desc}</p>
                <ul className="space-y-1.5">
                  {f.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" /> {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-indigo-600 transition-colors group-hover:text-indigo-700">
                  Learn more <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* ── User Roles ── */}
      <section id="roles" className="border-y border-slate-100 bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
              <Users className="h-3 w-3" /> Three Roles, One Platform
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Built for Everyone on Your Team
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base text-slate-500">
              Each role sees exactly what they need — and nothing more. Full data isolation at every layer.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {ROLES.map((r, i) => {
              const Icon = r.icon
              return (
                <motion.div
                  key={r.role}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className={`rounded-2xl border ${r.border} bg-white p-6 shadow-sm`}
                >
                  <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${r.color} shadow-md`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className={`mb-2 inline-block rounded-full ${r.bg} px-2.5 py-0.5 text-xs font-bold ${r.text}`}>
                    {r.role}
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-slate-500">{r.desc}</p>
                  <ul className="space-y-1.5">
                    {r.caps.map((c) => (
                      <li key={c} className="flex items-center gap-2 text-sm text-slate-500">
                        <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> {c}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-wrap justify-around gap-10 text-center">
            {[
              { value: 18, suffix: '', label: 'Prisma DB Models', sub: 'Full relational schema' },
              { value: 3, suffix: '', label: 'User Roles', sub: 'SuperAdmin / Admin / Client' },
              { value: 3, suffix: '', label: 'Scheduled Jobs', sub: 'Escalation · Reminders · Auto-close' },
              { value: 100, suffix: '%', label: 'Real-time', sub: 'Socket.io powered updates' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-5xl font-extrabold text-indigo-600">
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-700">{s.label}</div>
                <div className="text-xs text-slate-400">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Automation section ── */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:flex lg:items-center lg:gap-20">
        <div className="flex-1 lg:max-w-[520px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
              <Bot className="h-3 w-3" /> Always-On Automation
            </div>
            <h2 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
              The Platform That Works <span className="text-indigo-600">While You Sleep</span>
            </h2>
            <p className="mb-8 text-base leading-relaxed text-slate-500">
              Three background jobs run continuously to keep your SLAs on track, your clients
              informed, and your ticket queue clean — without any manual intervention.
            </p>

            <ul className="space-y-5">
              {[
                {
                  icon: TrendingUp,
                  title: 'SLA Escalation — Every 30 Minutes',
                  desc: 'Scans all open tickets and automatically marks overdue ones, ensuring no SLA breach goes unnoticed.',
                },
                {
                  icon: Bell,
                  title: 'Reminder Emails — Every Hour',
                  desc: 'Sends scheduled reminder emails for active reminders tied to tickets and companies via Resend SDK.',
                },
                {
                  icon: Clock,
                  title: 'Auto-Close — Daily at Midnight',
                  desc: 'Closes tickets that have been inactive for N days (configurable per company, default 30 days).',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex gap-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50">
                    <Icon className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-sm font-bold text-slate-800">{title}</p>
                    <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Right: dark workflows panel */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-16 flex-1 lg:mt-0"
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#0a1030] p-6 shadow-2xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-white/40">Active System Processes</p>
            <div className="space-y-2.5">
              {ACTIVE_WORKFLOWS.map((w, i) => (
                <motion.div
                  key={w.label}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-4 py-3"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${w.dot}`} />
                  <span className="text-sm font-medium text-white/80">{w.label}</span>
                </motion.div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-xs text-white/30">node-cron powered</span>
              <span className="text-xs font-semibold text-emerald-400">All systems nominal</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-600">
              <GitBranch className="h-3 w-3" /> How It Works
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
              From Invite to Resolution in <span className="text-indigo-600">Minutes</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base text-slate-500">
              No complex setup. No IT required. Just a clean workflow that your team and clients will love.
            </p>
          </motion.div>

          <div className="relative grid gap-10 md:grid-cols-3">
            <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent md:block" />

            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.14 }}
                  className="relative text-center"
                >
                  <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-md shadow-indigo-50">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                      {step.num}
                    </span>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${step.gradient}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-base font-bold text-slate-800">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <motion.section
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65 }}
        className="relative overflow-hidden bg-gradient-to-br from-[#060d2e] via-[#0f1e5e] to-[#1a3a9f] py-24"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        <div className="pointer-events-none absolute -top-24 left-1/3 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-[#63B3FF]" /> Multi-tenant SaaS · Built by BusinessValue365
          </div>
          <h2 className="mb-4 text-4xl font-extrabold text-white md:text-5xl">
            Ready to Experience<br />
            <span className="text-[#63B3FF]">ClientPortal365?</span>
          </h2>
          <p className="mb-10 text-base text-white/60">
            A unified workspace for client onboarding, ticket management, and real-time collaboration —
            built for modern service teams.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="beam-sweep flex items-center gap-2 rounded-xl bg-[#63B3FF] px-9 py-4 text-sm font-bold text-white shadow-xl shadow-[#63B3FF]/30 transition-all hover:bg-[#4DA8FF]"
              >
                Sign In Now <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.03 }}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-sm font-semibold text-white/90 backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Client Portal
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 shadow-sm shadow-indigo-200">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-extrabold tracking-tight text-slate-800">
                Client<span className="text-indigo-600">Portal</span><span className="text-[#63B3FF]">365</span>
              </span>
            </div>
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} BusinessValue365 · Built for client success.
            </p>
            <div className="flex gap-5 text-sm text-slate-400">
              {['Privacy', 'Terms', 'Contact'].map((l) => (
                <a key={l} href="#" className="transition-colors hover:text-indigo-600">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
