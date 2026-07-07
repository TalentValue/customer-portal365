import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'
import {
  Shield, Zap, BarChart3, ArrowRight, CheckCircle,
  Users, TrendingUp, Bell, BrainCircuit, Bot,
  BookOpen, UserCheck, Settings, GitBranch,
  PlayCircle, Search, FileText, Clock,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

/* ── Sparkline ── */
function Sparkline({ points, color = '#2563eb' }: { points: number[]; color?: string }) {
  const w = 110, h = 32
  const max = Math.max(...points), min = Math.min(...points)
  const range = max - min || 1
  const pts = points
    .map((v, i) => `${(i / (points.length - 1)) * w},${h - ((v - min) / range) * (h - 6) - 3}`)
    .join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
    </svg>
  )
}

/* ── AnimatedCounter ── */
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

/* ── Data ── */
const FEATURES = [
  { icon: UserCheck, color: 'bg-blue-600',   title: 'Client Onboarding',      desc: 'Automated onboarding workflows, document collection, and approval flows. Get clients up and running in minutes, not days.' },
  { icon: FileText,  color: 'bg-violet-600', title: 'Ticket Management',       desc: 'Smart ticket routing, prioritization, and real-time collaboration. Keep every request organized and nothing slips through.' },
  { icon: Zap,       color: 'bg-orange-500', title: 'Automation Engine',       desc: 'AI-powered workflows and triggers that handle repetitive tasks so your team can focus on what matters most — your clients.' },
  { icon: BookOpen,  color: 'bg-teal-600',   title: 'Knowledge Base Portal',   desc: 'Self-service knowledge base for clients with articles, guides, and FAQ. Reduce tickets and empower your clients.' },
  { icon: BarChart3, color: 'bg-blue-600',   title: 'Reports & Analytics',     desc: 'Real-time dashboards and custom reports to track performance, SLA metrics, and team productivity at a glance.' },
  { icon: Users,     color: 'bg-indigo-600', title: 'Team & Roles',            desc: 'Granular permissions, role-based access, and team management tools to keep your organization secure and efficient.' },
]

const ROLES = [
  { title: 'Team Leaders', color: 'text-blue-600',   iconBg: 'bg-blue-100',   icon: TrendingUp,
    items: ['Real-time team dashboards', 'SLA monitoring & alerts', 'Workload management', 'Performance reports'] },
  { title: 'Agents',       color: 'text-violet-600', iconBg: 'bg-violet-100', icon: UserCheck,
    items: ['Unified ticket workspace', 'Client communication', 'Automation suggestions', 'Knowledge base access'] },
  { title: 'Clients',      color: 'text-blue-600',   iconBg: 'bg-blue-100',   icon: Users,
    items: ['Self-service portal', 'Track request status', 'Access documents', 'Get instant updates'] },
]

const WORKFLOW = [
  { num: 1, icon: Search,      label: 'Ticket Received',               desc: 'New request from client portal' },
  { num: 2, icon: BrainCircuit,label: 'AI Analysis',                   desc: 'Intent detected & priority assigned' },
  { num: 3, icon: GitBranch,   label: 'Smart Routing',                 desc: 'Assigned to best available agent' },
  { num: 4, icon: Settings,    label: 'Automation Rules',              desc: 'Tasks created & notifications sent' },
  { num: 5, icon: Bell,        label: 'Client Notified',               desc: 'Client updated automatically' },
  { num: 6, icon: CheckCircle, label: 'Workflow Completed Successfully',desc: '2.4s', done: true },
]

const STEPS = [
  { num: 1, icon: Users,        title: 'Invite Your Team',   desc: 'Add your team members and set roles in just a few clicks.' },
  { num: 2, icon: Settings,     title: 'Setup Your Portal',  desc: 'Configure workflows, SLAs, and branding to match your agency.' },
  { num: 3, icon: CheckCircle,  title: 'Deliver for Clients',desc: 'Start resolving requests and delighting your clients instantly.' },
]

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } }

/* ── Component ── */
export default function Landing() {
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (isAuthenticated)
      navigate(user?.role === 'CLIENT' ? '/portal/dashboard' : '/admin/dashboard', { replace: true })
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-800">

      {/* ══ Navbar ══ */}
      <nav className={[
        'fixed inset-x-0 top-0 z-50 flex items-center justify-between px-8 py-4 transition-all duration-300',
        scrolled ? 'border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur-md' : 'bg-white',
      ].join(' ')}>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-blue-200 bg-white shadow-sm">
            <Shield className="h-4 w-4 text-blue-600" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            ClientPortal<span className="text-blue-600">365</span>
          </span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          {['Features', 'Solutions', 'Pricing', 'Resources'].map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-600">{l}</a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
            Sign in
          </Link>
          <Link to="/login"
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
            Start Free Trial
          </Link>
        </div>
      </nav>

      {/* ══ Hero ══ */}
      <section className="relative overflow-hidden bg-white pt-20">

        {/* AI bg: dot grid */}
        <div className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(37,99,235,0.07) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        {/* AI bg: soft orb behind card */}
        <div className="pointer-events-none absolute right-[8%] top-[5%] h-[520px] w-[520px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.09) 0%, transparent 70%)' }} />

        {/* AI bg: floating particles */}
        {[
          { left: '4%',  top: '35%', size: 4, dur: '5s',   delay: '0s'   },
          { left: '14%', top: '65%', size: 3, dur: '6.5s', delay: '1.2s' },
          { left: '82%', top: '20%', size: 3, dur: '4.8s', delay: '0.5s' },
          { left: '92%', top: '70%', size: 4, dur: '7s',   delay: '2s'   },
          { left: '48%', top: '85%', size: 3, dur: '5.5s', delay: '1.8s' },
          { left: '68%', top: '15%', size: 3, dur: '6.2s', delay: '0.9s' },
        ].map((p, i) => (
          <div key={i} className="pointer-events-none absolute rounded-full"
            style={{
              left: p.left, top: p.top, width: p.size, height: p.size,
              background: 'rgba(37,99,235,0.55)',
              boxShadow: '0 0 4px 1px rgba(37,99,235,0.25)',
              animation: 'ai-particle linear infinite',
              animationDuration: p.dur, animationDelay: p.delay,
            }} />
        ))}

        {/* AI bg: scan beam */}
        <div className="hero-v-scan" style={{ opacity: 0.35 }} />

        <div className="relative mx-auto max-w-7xl px-8 py-20 lg:flex lg:items-center lg:gap-14">

          {/* Left copy */}
          <div className="flex-[0.85] lg:max-w-[500px]">

            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-600">
              <Shield className="h-3.5 w-3.5" /> AI-Powered Client Operations Platform
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mb-5 text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
              The Client Portal<br />Built for<br />
              <span className="text-blue-600">Service Teams</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mb-8 text-base leading-relaxed text-slate-500">
              Streamline onboarding, manage tickets, automate workflows, and deliver
              exceptional client experiences — all in one unified platform.
              Built for modern service teams that move fast.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
              className="mb-8 flex flex-wrap gap-3">
              <Link to="/login">
                <button className="beam-sweep flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-700">
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-600">
                <PlayCircle className="h-4 w-4" /> Watch Demo
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.52 }}
              className="flex flex-wrap gap-5 text-xs text-slate-500">
              {['No credit card required', '14-day free trial', 'Cancel anytime'].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-blue-500" /> {t}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Platform Performance card */}
          <motion.div initial={{ opacity: 0, x: 36 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.32, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-14 flex-1 lg:mt-0">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">

              {/* Header */}
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Platform Performance</p>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Live
                  </span>
                  <span className="rounded border border-slate-200 px-2 py-0.5 text-[10px] text-slate-400">
                    Feb 20, 2025 – Mar 20, 2025 ∨
                  </span>
                </div>
              </div>

              {/* Stats 2×2 */}
              <div className="mb-5 grid grid-cols-2 gap-3">
                {[
                  { val: '98%',  label: 'SLA Compliance',   data: [55,60,68,72,76,82,86,90,93,95,96,98] },
                  { val: '100%', label: 'System Uptime',     data: [98,100,99,100,100,98,99,100,100,100,99,100] },
                  { val: '24/7', label: 'Support Coverage',  data: [24,24,24,24,24,24,24,24,24,24,24,24] },
                  { val: '2.3k', label: 'Active Clients',    data: [1.1,1.3,1.5,1.6,1.8,1.9,2.0,2.1,2.2,2.2,2.3,2.3] },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                    <div className="text-2xl font-extrabold text-slate-900">{s.val}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{s.label}</div>
                    <div className="mt-2"><Sparkline points={s.data} /></div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Recent Activity</p>
                  <a href="#" className="text-[11px] font-semibold text-blue-600 hover:underline">View all</a>
                </div>
                <div className="space-y-2.5">
                  {[
                    { dot: 'bg-amber-400',  text: 'New client onboarding completed', time: '2m ago'  },
                    { dot: 'bg-blue-500',   text: 'Ticket #INC-4821 resolved',       time: '15m ago' },
                    { dot: 'bg-emerald-500',text: 'SLA breach prevented by automation', time: '32m ago' },
                  ].map((a) => (
                    <div key={a.text} className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${a.dot}`} />
                        <span className="text-slate-600">{a.text}</span>
                      </div>
                      <span className="shrink-0 text-slate-400">{a.time}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50 px-4 py-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                    <Bot className="h-3.5 w-3.5" /> AI Automation Saved
                  </div>
                  <span className="text-xs font-bold text-blue-700">129 hours this month</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ Features ══ */}
      <motion.section id="features"
        variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}
        className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-8">

          <motion.div variants={fade} className="mb-14 text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
              <ArrowRight className="h-3 w-3" /> Core Capabilities
            </div>
            <h2 className="mb-2 text-4xl font-extrabold tracking-tight text-slate-900">
              Every Feature Your Agency Needs
            </h2>
            <div className="mb-4 text-2xl font-extrabold text-blue-600">Built In & Production-Ready</div>
            <p className="mx-auto max-w-md text-sm text-slate-500">
              Powerful features designed to streamline operations
              and delight your clients at every touchpoint.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <motion.div key={f.title} variants={fade}
                  whileHover={{ y: -4, transition: { duration: 0.18 } }}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md hover:shadow-blue-50">
                  <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.color} shadow-sm`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-slate-800">{f.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-slate-500">{f.desc}</p>
                  <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 transition-transform group-hover:translate-x-0.5">
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.section>

      {/* ══ Built for Everyone ══ */}
      <section className="bg-slate-50/70 py-24">
        <div className="mx-auto max-w-6xl px-8">

          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-12 text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
              <ArrowRight className="h-3 w-3" /> Built for Everyone
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Built for Everyone on Your Team
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-slate-500">
              The right tools for every role and responsibility.
            </p>
          </motion.div>

          <div className="mb-16 grid gap-5 md:grid-cols-3">
            {ROLES.map((r, i) => {
              const Icon = r.icon
              return (
                <motion.div key={r.title}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${r.iconBg}`}>
                      <Icon className={`h-4 w-4 ${r.color}`} />
                    </div>
                    <h3 className={`font-bold ${r.color}`}>{r.title}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {r.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="h-4 w-4 shrink-0 text-blue-500" /> {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )
            })}
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: 98,  suffix: '%',  label: 'SLA Compliance'        },
              { value: 3,   suffix: '',   label: 'Min Avg. Response Time' },
              { value: 100, suffix: '%',  label: 'System Uptime'          },
              { value: 24,  suffix: '/7', label: 'Support Coverage'       },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-extrabold text-blue-600">
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-1 text-sm text-slate-500">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ How It Works ══ */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-8 lg:flex lg:items-start lg:gap-16">

          {/* Left */}
          <div className="flex-1 lg:max-w-[460px]">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>

              <div className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-600">
                <ArrowRight className="h-3 w-3" /> How It Works
              </div>

              <h2 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900">
                The Platform That<br />
                Works <span className="text-blue-600">While You Sleep</span>
              </h2>

              <p className="mb-8 text-sm leading-relaxed text-slate-500">
                Our AI-powered automation works 24/7 to ensure
                nothing falls through the cracks.
              </p>

              <ul className="space-y-3.5">
                {[
                  'AI monitors and prioritizes incoming requests',
                  'Automated workflows route to the right people',
                  'SLA policies ensure timely responses',
                  'Clients stay informed automatically',
                  'Reports and insights keep you in control',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                    <CheckCircle className="h-5 w-5 shrink-0 text-blue-500" /> {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Right: Automation Workflow card */}
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-12 flex-1 lg:mt-0">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Automation Workflow</p>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Live
                </span>
              </div>

              <div className="space-y-2.5">
                {WORKFLOW.map((step, i) => {
                  const Icon = step.icon
                  return (
                    <motion.div key={step.num}
                      initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${step.done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50/50'}`}>
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step.done ? 'bg-emerald-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                        {step.done ? <CheckCircle className="h-4 w-4" /> : step.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${step.done ? 'text-emerald-700' : 'text-slate-700'}`}>{step.label}</p>
                        {!step.done && <p className="text-xs text-slate-400">{step.desc}</p>}
                      </div>
                      {step.done && (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                          {step.desc}
                        </span>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ Get Started ══ */}
      <section className="bg-slate-50/70 py-24">
        <div className="mx-auto max-w-5xl px-8">

          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-14 text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
              <ArrowRight className="h-3 w-3" /> Get Started
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
              From Invite to Resolution in{' '}
              <span className="text-blue-600">Minutes</span>
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-slate-500">
              Simple, fast, and built for modern teams.
            </p>
          </motion.div>

          <div className="grid gap-10 md:grid-cols-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div key={step.num}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                  className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 shadow-sm">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-slate-800">{step.num}. {step.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="relative overflow-hidden bg-white py-24">

        {/* AI bg: particles */}
        {[
          { left: '8%',  top: '25%', size: 4, dur: '5s',   delay: '0s'  },
          { left: '88%', top: '30%', size: 3, dur: '6.5s', delay: '1s'  },
          { left: '50%', top: '75%', size: 3, dur: '7s',   delay: '2s'  },
          { left: '22%', top: '70%', size: 3, dur: '5.5s', delay: '0.6s'},
          { left: '75%', top: '65%', size: 4, dur: '6s',   delay: '1.5s'},
        ].map((p, i) => (
          <div key={i} className="pointer-events-none absolute rounded-full"
            style={{
              left: p.left, top: p.top, width: p.size, height: p.size,
              background: 'rgba(37,99,235,0.4)',
              animation: 'ai-particle linear infinite',
              animationDuration: p.dur, animationDelay: p.delay,
            }} />
        ))}

        <div className="relative mx-auto max-w-2xl px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900">
              Ready to Experience<br />
              <span className="text-blue-600">ClientPortal365?</span>
            </h2>
            <p className="mb-10 text-base text-slate-500">
              Join thousands of agencies that trust us to power their client operations.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/login">
                <button className="beam-sweep flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-700">
                  Start Free Trial
                </button>
              </Link>
              <Link to="/login">
                <button className="flex items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-600">
                  Book a Demo
                </button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 leading-none">
          <svg viewBox="0 0 1440 90" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0,45 C240,90 480,10 720,50 C960,90 1200,20 1440,50 L1440,90 L0,90 Z"
              fill="rgba(37,99,235,0.06)" />
            <path d="M0,60 C360,20 720,80 1080,40 C1260,20 1380,55 1440,65 L1440,90 L0,90 Z"
              fill="rgba(37,99,235,0.04)" />
            <path d="M0,72 C480,50 960,80 1440,60 L1440,90 L0,90 Z"
              fill="rgba(99,179,255,0.06)" />
          </svg>
        </div>
      </section>

      {/* ══ Footer ══ */}
      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="mx-auto max-w-6xl px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-blue-200 bg-white shadow-sm">
                <Shield className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span className="text-sm font-bold text-slate-800">
                ClientPortal<span className="text-blue-600">365</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} ClientPortal365. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-slate-500">
              {['Privacy', 'Terms', 'Status'].map((l) => (
                <a key={l} href="#" className="transition-colors hover:text-blue-600">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
