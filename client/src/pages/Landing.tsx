import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'
import { Shield, Ticket, Zap, BarChart3, ArrowRight, CheckCircle, Globe, Lock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  duration: Math.random() * 8 + 6,
  delay: Math.random() * 4,
}))

const FEATURES = [
  {
    icon: Ticket,
    title: 'Smart Ticketing',
    desc: 'AI-powered ticket routing, SLA tracking, and automated escalation keep every request on track.',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    border: 'border-blue-100 hover:border-blue-300',
    shadow: 'hover:shadow-blue-100',
  },
  {
    icon: Zap,
    title: 'Real-time Collaboration',
    desc: 'Live updates, Socket.io powered notifications, and a shared workspace for seamless teamwork.',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    border: 'border-purple-100 hover:border-purple-300',
    shadow: 'hover:shadow-purple-100',
  },
  {
    icon: BarChart3,
    title: 'AI-Driven Insights',
    desc: 'Deep analytics, performance dashboards, and predictive reports that surface what matters most.',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    border: 'border-cyan-100 hover:border-cyan-300',
    shadow: 'hover:shadow-cyan-100',
  },
]

const TRUST = [
  { icon: CheckCircle, text: 'SOC 2 compliant' },
  { icon: Lock, text: 'End-to-end encrypted' },
  { icon: Globe, text: 'Multi-tenant isolation' },
]

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 60, damping: 20 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (inView) motionVal.set(target)
  }, [inView, motionVal, target])

  useEffect(() => {
    return spring.on('change', (v) => setDisplay(Math.round(v)))
  }, [spring])

  return <span ref={ref}>{display}{suffix}</span>
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

export default function Landing() {
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.role === 'CLIENT' ? '/portal/dashboard' : '/admin/dashboard', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f8ff] text-slate-800">

      {/* ── Soft aurora background ── */}
      <div
        className="pointer-events-none absolute inset-0 animate-aurora opacity-40"
        style={{
          background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 25%, #ecfeff 50%, #eff6ff 75%, #faf5ff 100%)',
        }}
      />

      {/* ── Dot grid ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.2) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* ── Soft orbs ── */}
      <motion.div
        className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-200/50 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-purple-200/40 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-20 left-1/3 h-[400px] w-[400px] rounded-full bg-cyan-200/40 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      {/* ── Floating particles ── */}
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="pointer-events-none absolute rounded-full bg-indigo-400/30"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -28, 0], opacity: [0.15, 0.45, 0.15] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
        />
      ))}

      {/* ── Nav ── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex items-center justify-between border-b border-indigo-100/60 bg-white/60 px-6 py-4 backdrop-blur-md md:px-12"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-200">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-800">
            Client<span className="text-indigo-600">Portal</span>
            <span className="text-cyan-500">365</span>
          </span>
        </div>
        <Link
          to="/login"
          className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-200 transition-all duration-200 hover:shadow-indigo-300 hover:scale-105"
        >
          Sign In
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center px-6 pb-16 pt-14 text-center md:pt-24">

        {/* Animated logo ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-300"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute h-24 w-24 rounded-3xl"
            style={{
              background: 'conic-gradient(from 0deg, transparent 65%, rgba(99,102,241,0.5) 100%)',
            }}
          />
          <Shield className="relative h-9 w-9 text-white" />
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-medium text-indigo-600"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
          AI-Powered · Real-time · Multi-tenant
        </motion.div>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-5 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl"
        >
          <span className="animate-shimmer bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
            ClientPortal365
          </span>
          <br />
          <span className="text-slate-800">Built for the Future</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="mb-10 max-w-xl text-lg leading-relaxed text-slate-500 md:text-xl"
        >
          Streamline client onboarding, centralize communication, and track every requirement —
          all in one intelligent platform.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-200 transition-shadow duration-300 hover:shadow-indigo-300"
            >
              <span className="relative z-10">Enter Portal</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600"
                initial={{ x: '100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </Link>
          <span className="text-sm text-slate-400">No credit card required</span>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-5"
        >
          {TRUST.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-slate-400">
              <Icon className="h-3.5 w-3.5 text-indigo-400" />
              {text}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="relative z-10 mx-auto mb-16 flex max-w-2xl flex-wrap justify-center gap-12 px-6"
      >
        {[
          { value: 500, suffix: '+', label: 'Companies Onboarded' },
          { value: 98, suffix: '%', label: 'Client Satisfaction' },
          { value: 3, suffix: '×', label: 'Faster Onboarding' },
        ].map((stat) => (
          <motion.div key={stat.label} variants={itemVariants} className="text-center">
            <div className="animate-shimmer bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 bg-clip-text text-4xl font-extrabold text-transparent">
              <AnimatedCounter target={stat.value} suffix={stat.suffix} />
            </div>
            <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
          </motion.div>
        ))}
      </motion.section>

      {/* ── Feature cards ── */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="relative z-10 mx-auto mb-20 grid max-w-5xl grid-cols-1 gap-6 px-6 sm:grid-cols-3"
      >
        {FEATURES.map((f) => {
          const Icon = f.icon
          return (
            <motion.div
              key={f.title}
              variants={itemVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`group rounded-2xl border bg-white p-6 shadow-md transition-all duration-300 hover:shadow-xl ${f.border} ${f.shadow}`}
            >
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${f.iconBg}`}>
                <Icon className={`h-5 w-5 ${f.iconColor}`} />
              </div>
              <h3 className="mb-2 text-base font-semibold text-slate-800">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </motion.div>
          )
        })}
      </motion.section>

      {/* ── CTA banner ── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative z-10 mx-auto mb-20 max-w-3xl px-6 text-center"
      >
        <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 p-10 shadow-lg shadow-indigo-100">
          <h2 className="mb-3 text-3xl font-bold text-slate-800">Ready to transform your workflow?</h2>
          <p className="mb-8 text-slate-500">
            Sign in to your portal and experience the future of client management.
          </p>
          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:shadow-indigo-300"
            >
              Get Started Now
            </motion.button>
          </Link>
        </div>
      </motion.section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} BusinessValue365 · ClientPortal365
      </footer>
    </div>
  )
}
