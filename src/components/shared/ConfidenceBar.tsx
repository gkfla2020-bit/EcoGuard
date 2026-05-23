import { motion } from 'framer-motion'

type Props = {
  value: number // 0-100
  showLabel?: boolean
}

export default function ConfidenceBar({ value, showLabel = true }: Props) {
  const color = value >= 95 ? 'bg-emerald-500' : value >= 90 ? 'bg-amber-400' : 'bg-red-400'

  return (
    <div className="flex items-center gap-2">
      <div className="w-12 h-[5px] bg-surface2 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <span className={`font-mono text-[10px] font-medium ${
          value >= 95 ? 'text-emerald-600' : value >= 90 ? 'text-amber-600' : 'text-red-600'
        }`}>{value.toFixed(1)}%</span>
      )}
    </div>
  )
}
