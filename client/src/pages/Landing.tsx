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
  { label: 'ZeptoMail Queue — transactional delivery', dot: 'bg-amber-400' },
]

const AI_LOG = [
  { tag: 'SLA', msg: 'Escalation scan complete — 4 tickets within threshold', color: 'text-emerald-400' },
  { tag: 'MAIL', msg: 'ZeptoMail: reminder dispatched → TechCorp client', color: 'text-[#63B3FF]' },
  { tag: 'RT', msg: 'Socket.io: 3 sessions live — updates streaming', color: 'text-purple-400' },
  { tag: 'AUTO', msg: 'Auto-close: scanned 12 tickets — 0 archived', color: 'text-amber-400' },
  { tag: 'AUTH', msg: 'JWT refresh rotated — session extended 7d', color: 'text-emerald-400' },
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
  const [logIndex, setLogIndex] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  const TIPS = [
    'AI escalation engine fires every 30 min — zero SLA breaches',
    'Socket.io streams live ticket updates to every client session',
    'ZeptoMail dispatches transactional emails the instant events fire',
    'Multi-tenant isolation: each company sees only its own data',
    'PWA-ready — install on desktop or mobile, works offline too',
  ]

  useEffect(() => {
    if (isAuthenticated)
      navigate(user?.role === 'CLIENT' ? '/portal/dashboard' : '/admin/dashboard', { replace: true })
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    const id = setInterval(() => setTipIndex((p) => (p + 1) % TIPS.length), 3400)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setLogIndex((p) => (p + 1) % AI_LOG.length), 2800)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-800">

      {/* ── Navbar ── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={[
          'fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 md:px-14',
          'transition-all duration-300',
          scrolled
            ? 'border-b border-white/20 bg-white/80 shadow-sm shadow-slate-200/60 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        ].join(' ')}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-md shadow-indigo-200/50">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className={`text-lg font-extrabold tracking-tight transition-colors duration-300 ${scrolled ? 'text-slate-900' : 'text-white'}`}>
            Client<span className="text-indigo-400">Portal</span><span className="text-[#63B3FF]">365</span>
          </span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          {[
            { label: 'Features', href: '#features' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'User Roles', href: '#roles' },
          ].map((item) => (
            <a key={item.label} href={item.href}
              className={`text-sm font-medium transition-colors duration-300 ${scrolled ? 'text-slate-500 hover:text-indigo-600' : 'text-white/70 hover:text-white'}`}>
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login"
            className={`hidden text-sm font-medium transition-colors duration-300 sm:block ${scrolled ? 'text-slate-600 hover:text-indigo-600' : 'text-white/80 hover:text-white'}`}>
            Sign In
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-900/40 transition-all hover:bg-indigo-500 hover:shadow-lg"
          >
            Get Started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#020818] via-[#060d2e] to-[#0d1f5c] pt-20">

        {/* ── AI Background: dot grid ── */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(99,179,255,0.5) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

        {/* ── AI Background: neural network SVG ── */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.22]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="ng" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#63B3FF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#63B3FF" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Connection lines */}
          {([
            [120,80,  320,60],  [320,60,  540,100], [540,100, 620,240],
            [620,240, 500,370], [500,370, 280,390], [280,390, 100,320],
            [100,320, 60,180],  [60,180,  120,80],
            [320,60,  280,200], [280,200, 500,370],
            [540,100, 440,210], [440,210, 280,200],
            [280,200, 100,320], [440,210, 620,240],
          ] as [number,number,number,number][]).map(([x1,y1,x2,y2], i) => (
            <line key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#63B3FF" strokeWidth="0.8" strokeOpacity="0.4"
              strokeDasharray="6 4"
              style={{ animation: `dash-flow ${3 + i * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }}
            />
          ))}
          {/* Nodes */}
          {[
            [120,80],[320,60],[540,100],[620,240],[500,370],[280,390],[100,320],[60,180],[280,200],[440,210],
          ].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="14" fill="#63B3FF" fillOpacity="0.06" />
              <circle cx={cx} cy={cy} r="4" fill="#63B3FF" fillOpacity="0.9"
                style={{ animation: `neural-blink ${2 + i * 0.35}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
              <circle cx={cx} cy={cy} r="8" fill="none" stroke="#63B3FF" strokeWidth="0.8" strokeOpacity="0.4"
                className="pulse-ring" style={{ animationDelay: `${i * 0.25}s` }} />
            </g>
          ))}
        </svg>

        {/* ── AI Background: ambient orbs ── */}
        <motion.div className="pointer-events-none absolute -top-32 left-1/4 h-[480px] w-[480px] rounded-full blur-[110px]"
          style={{ background: 'radial-gradient(circle, rgba(99,179,255,0.18) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="pointer-events-none absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full blur-[90px]"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 3 }} />
        <motion.div className="pointer-events-none absolute top-1/2 right-20 h-[280px] w-[280px] rounded-full blur-[80px]"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 5 }} />

        {/* ── AI Background: vertical scan beam ── */}
        <div className="hero-v-scan" />

        {/* ── AI Background: floating particles ── */}
        {[
          { left: '12%', bottom: '20%', size: 3, dur: '5s', delay: '0s' },
          { left: '28%', bottom: '15%', size: 2, dur: '6.5s', delay: '1.2s' },
          { left: '55%', bottom: '25%', size: 4, dur: '4.8s', delay: '0.5s' },
          { left: '72%', bottom: '18%', size: 2, dur: '7s',   delay: '2s' },
          { left: '88%', bottom: '30%', size: 3, dur: '5.5s', delay: '1.8s' },
          { left: '40%', bottom: '10%', size: 2, dur: '6s',   delay: '0.8s' },
        ].map((p, i) => (
          <div key={i} className="ai-particle"
            style={{ left: p.left, bottom: p.bottom, width: p.size, height: p.size, animationDuration: p.dur, animationDelay: p.delay }} />
        ))}

        {/* ── Main content ── */}
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32 lg:flex lg:items-center lg:gap-16">

          {/* Left copy */}
          <div className="flex-1 lg:max-w-[580px]">

            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#63B3FF]/30 bg-[#63B3FF]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#63B3FF] backdrop-blur-sm">
              <Bot className="h-3.5 w-3.5" />
              AI-Powered Automation · BusinessValue365
            </motion.div>

            {/* Headline */}
            <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 text-5xl font-extrabold leading-[1.06] tracking-tight text-white md:text-6xl lg:text-[64px]">
              The Client Portal<br />
              Built for{' '}
              <span className="relative inline-block">
                <span className="text-[#63B3FF]">Service Teams</span>
                <motion.span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-[#63B3FF] to-purple-400"
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: 'left' }} />
              </span>
            </motion.h1>

            {/* Rotating AI tip */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              className="mb-6 flex items-center gap-2.5 rounded-xl border border-[#63B3FF]/20 bg-[#63B3FF]/8 px-4 py-3 backdrop-blur-sm">
              <BrainCircuit className="h-4 w-4 shrink-0 text-[#63B3FF]" />
              <div className="h-5 overflow-hidden flex-1">
                <AnimatePresence mode="wait">
                  <motion.p key={tipIndex}
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm font-medium text-white/90">
                    {TIPS[tipIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#63B3FF]" />
            </motion.div>

            {/* Description */}
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
              className="mb-10 text-base leading-relaxed text-white/60 md:text-lg">
              Onboard clients, manage tickets end-to-end, and let three AI-driven cron jobs handle
              SLA escalation, automated reminders via <span className="text-white/80 font-medium">ZeptoMail</span>, and
              auto-close — while <span className="text-white/80 font-medium">Socket.io</span> keeps every screen live.
              Built for agencies that can't afford to miss a deadline.
            </motion.p>

            {/* CTA buttons */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}
              className="flex flex-wrap gap-4">
              <Link to="/login">
                <motion.button whileHover={{ scale: 1.04, boxShadow: '0 16px 48px -8px rgba(99,179,255,0.5)' }} whileTap={{ scale: 0.97 }}
                  className="beam-sweep flex items-center gap-2 rounded-xl bg-[#63B3FF] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#63B3FF]/30 transition-all hover:bg-[#4DA8FF]">
                  Enter Portal <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
              <motion.a href="#features" whileHover={{ scale: 1.02 }}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/8 px-6 py-3.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition-all hover:bg-white/15">
                Explore Features <ChevronRight className="h-3.5 w-3.5" />
              </motion.a>
            </motion.div>

            {/* Trust badges */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.62 }}
              className="mt-8 flex flex-wrap gap-5 text-xs text-white/40">
              {[
                { icon: Zap, text: 'Socket.io Real-time' },
                { icon: Lock, text: 'JWT + RBAC' },
                { icon: Globe, text: 'Multi-tenant SaaS' },
                { icon: Bot, text: 'ZeptoMail Transactional' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-[#63B3FF]/70" /> {text}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: AI dashboard card */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.42, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-16 flex-1 lg:mt-0">

            {/* Floating status pill */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
              className="absolute -top-5 right-4 z-10 flex items-center gap-2 rounded-full border border-emerald-500/30 bg-[#020818]/90 px-4 py-2 shadow-xl backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-semibold text-white/90">AI Engine Active · All Systems Nominal</span>
            </motion.div>

            {/* Main dashboard card */}
            <div className="gradient-border-always overflow-hidden rounded-2xl bg-[#060d26]/90 p-6 shadow-2xl backdrop-blur-sm">

              {/* Header */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#63B3FF]/15">
                    <BrainCircuit className="h-4 w-4 text-[#63B3FF]" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white/60">Portal at a Glance</span>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> LIVE
                </span>
              </div>

              {/* Stats grid */}
              <div className="mb-5 grid grid-cols-2 gap-3">
                {[
                  { val: 3, suffix: '', label: 'User Roles', icon: Users },
                  { val: 18, suffix: '', label: 'DB Models', icon: GitBranch },
                  { val: 98, suffix: '%', label: 'SLA Score', icon: TrendingUp },
                  { val: 3, suffix: '', label: 'Cron Jobs', icon: Workflow },
                ].map((s, i) => (
                  <motion.div key={s.label}
                    initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="group relative overflow-hidden rounded-xl border border-white/8 bg-white/4 p-4 hover:border-[#63B3FF]/30 transition-colors">
                    <s.icon className="absolute right-3 top-3 h-4 w-4 text-white/10 group-hover:text-[#63B3FF]/20 transition-colors" />
                    <div className="text-3xl font-extrabold text-[#63B3FF]">
                      <AnimatedCounter target={s.val} suffix={s.suffix} />
                    </div>
                    <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-white/40">{s.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* AI activity log */}
              <div className="rounded-xl border border-white/10 bg-[#020818] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                    <span className="ml-2 text-xs text-white/25">ai-engine.log</span>
                  </div>
                  <span className="text-xs text-[#63B3FF]/60">live feed</span>
                </div>
                <div className="space-y-1.5 font-mono text-xs min-h-[72px]">
                  {/* Static lines */}
                  <p className="text-white/35">
                    <span className="text-white/20">$</span> sla-escalation
                    <span className="text-[#63B3FF]"> --interval 30m</span>
                    <span className="text-emerald-400"> ✓</span>
                  </p>
                  <p className="text-white/25">
                    <span className="text-white/20">$</span> reminder-job
                    <span className="text-white/30"> --freq 1h</span>
                    <span className="text-[#63B3FF]"> running</span>
                  </p>
                  {/* Rotating live log */}
                  <div className="h-[18px] overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.p key={logIndex}
                        initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="text-white/50">
                        <span className="text-white/20">›</span>{' '}
                        <span className={`${AI_LOG[logIndex].color} font-semibold`}>[{AI_LOG[logIndex].tag}]</span>{' '}
                        {AI_LOG[logIndex].msg}
                        <span className="caret-blink text-[#63B3FF]">▌</span>
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom brand pill */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <Shield className="h-4 w-4 text-[#63B3FF]" />
              <span className="text-sm font-semibold text-white/70">A BusinessValue365 Product</span>
              <span className="ml-auto flex items-center gap-1 text-xs text-white/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> PWA Ready
              </span>
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
      <section className="relative overflow-hidden bg-gradient-to-br from-[#020818] via-[#060d2e] to-[#0d1f5c]">

        {/* AI background: dot grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(99,179,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* AI background: neural nodes (smaller set) */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          {([
            [80,60,  380,40],  [380,40,  620,90],  [620,90,  700,220],
            [700,220,580,340], [580,340, 320,360], [320,360, 100,280],
            [100,280,80,60],   [380,40,  320,180], [320,180, 580,340],
            [620,90,  460,190],[460,190, 320,180],
          ] as [number,number,number,number][]).map(([x1,y1,x2,y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#63B3FF" strokeWidth="0.7" strokeOpacity="0.35" strokeDasharray="5 4"
              style={{ animation: `dash-flow ${3.5 + i * 0.35}s ease-in-out infinite`, animationDelay: `${i * 0.28}s` }} />
          ))}
          {([
            [80,60],[380,40],[620,90],[700,220],[580,340],[320,360],[100,280],[320,180],[460,190],
          ] as [number,number][]).map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="10" fill="#63B3FF" fillOpacity="0.05" />
              <circle cx={cx} cy={cy} r="3.5" fill="#63B3FF" fillOpacity="0.85"
                style={{ animation: `neural-blink ${2.2 + i * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.22}s` }} />
              <circle cx={cx} cy={cy} r="7" fill="none" stroke="#63B3FF" strokeWidth="0.7" strokeOpacity="0.3"
                className="pulse-ring" style={{ animationDelay: `${i * 0.3}s` }} />
            </g>
          ))}
        </svg>

        {/* AI background: ambient orbs */}
        <div className="pointer-events-none absolute -top-24 left-1/3 h-[380px] w-[380px] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(99,179,255,0.15) 0%, transparent 70%)' }} />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-[320px] w-[320px] rounded-full blur-[80px]"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />

        {/* AI background: scan beam */}
        <div className="hero-v-scan" style={{ animationDelay: '3.5s' }} />

        {/* AI background: particles */}
        {[
          { left: '8%',  bottom: '25%', size: 3, dur: '5.2s', delay: '0s' },
          { left: '35%', bottom: '12%', size: 2, dur: '6.8s', delay: '1.4s' },
          { left: '62%', bottom: '20%', size: 3, dur: '4.9s', delay: '0.7s' },
          { left: '85%', bottom: '35%', size: 2, dur: '7.1s', delay: '2.1s' },
        ].map((p, i) => (
          <div key={i} className="ai-particle"
            style={{ left: p.left, bottom: p.bottom, width: p.size, height: p.size, animationDuration: p.dur, animationDelay: p.delay }} />
        ))}

        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:flex lg:items-center lg:gap-20">

          {/* Left copy */}
          <div className="flex-1 lg:max-w-[520px]">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#63B3FF]/30 bg-[#63B3FF]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#63B3FF]">
                <Bot className="h-3 w-3" /> Always-On Automation
              </div>

              <h2 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
                The Platform That Works{' '}
                <span className="relative inline-block">
                  <span className="text-[#63B3FF]">While You Sleep</span>
                  <motion.span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-[#63B3FF] to-purple-400"
                    initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformOrigin: 'left' }} />
                </span>
              </h2>

              <p className="mb-8 text-base leading-relaxed text-white/60">
                Three background jobs run continuously to keep your SLAs on track, your clients
                informed, and your ticket queue clean — without any manual intervention.
              </p>

              <ul className="space-y-5">
                {[
                  { icon: TrendingUp, title: 'SLA Escalation — Every 30 Minutes', desc: 'Scans all open tickets and automatically marks overdue ones, ensuring no SLA breach goes unnoticed.', color: 'text-[#63B3FF]', bg: 'bg-[#63B3FF]/10 border-[#63B3FF]/20' },
                  { icon: Bell,       title: 'Reminder Emails — Every Hour',      desc: 'Sends scheduled ZeptoMail reminders for active tickets — timed perfectly to your company cadence.', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                  { icon: Clock,      title: 'Auto-Close — Daily at Midnight',     desc: 'Closes tickets inactive for N days (configurable per company, default 30 days) — queue stays clean.', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                ].map(({ icon: Icon, title, desc, color, bg }, i) => (
                  <motion.li key={title}
                    initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                    className="flex gap-4">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${bg}`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div>
                      <p className={`mb-0.5 text-sm font-bold ${color}`}>{title}</p>
                      <p className="text-sm leading-relaxed text-white/50">{desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Right: glowing workflows panel */}
          <motion.div
            initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-16 flex-1 lg:mt-0"
          >
            <div className="gradient-border-always overflow-hidden rounded-2xl bg-[#060d26]/90 p-6 shadow-2xl backdrop-blur-sm">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">Active System Processes</p>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Running
                </span>
              </div>

              <div className="space-y-2.5">
                {ACTIVE_WORKFLOWS.map((w, i) => (
                  <motion.div key={w.label}
                    initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="scan-sweep flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-4 py-3.5">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${w.dot}`} />
                      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${w.dot}`} />
                    </span>
                    <span className="text-sm font-medium text-white/80">{w.label}</span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="flex items-center gap-1.5 text-xs text-white/30">
                  <Workflow className="h-3 w-3" /> node-cron powered
                </span>
                <span className="text-xs font-semibold text-emerald-400">All systems nominal</span>
              </div>
            </div>

            {/* Uptime badge */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.6 }}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <Zap className="h-4 w-4 text-[#63B3FF]" />
              <span className="text-sm font-semibold text-white/70">Zero-downtime background execution</span>
            </motion.div>
          </motion.div>
        </div>
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
