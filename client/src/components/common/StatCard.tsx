import { motion } from 'framer-motion'
import { useCountUp } from '@/hooks/useCountUp'

interface StatCardProps {
  label: string
  value: number
  icon: React.ElementType
  desc?: string
  gradient: string
  glow?: string
  topBar?: string
  textColor?: string
  index?: number
  onClick?: () => void
}

export function StatCard({
  label, value, icon: Icon, desc, gradient,
  glow = 'shadow-indigo-100', topBar, textColor = 'text-slate-800', index = 0, onClick,
}: StatCardProps) {
  const count = useCountUp(value)
  const Comp = onClick ? motion.button : motion.div

  return (
    <Comp
      onClick={onClick}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`group relative w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm ${glow} overflow-hidden transition-shadow duration-300 hover:shadow-lg`}
    >
      {/* Roving glow on hover */}
      <div
        className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br ${gradient} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-[0.08]`}
      />
      {topBar && <div className={`relative h-1 w-full ${topBar}`} />}
      <div className="relative p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
            <div className={`text-3xl font-extrabold tabular-nums ${textColor}`}>{count}</div>
          </div>
          <motion.div
            whileHover={{ rotate: 8, scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}
          >
            <Icon className="h-5 w-5 text-white" />
          </motion.div>
        </div>
        {desc && <p className="text-xs text-slate-400">{desc}</p>}
      </div>
    </Comp>
  )
}
