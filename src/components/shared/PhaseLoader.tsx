import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type Phase = {
  id: string
  label: string
  icon: LucideIcon
  duration: number
}

type Props = {
  phases: Phase[]
  onComplete: () => void
}

export default function PhaseLoader({ phases, onComplete }: Props) {
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (phaseIdx >= phases.length) {
      onComplete()
      return
    }
    const duration = phases[phaseIdx].duration
    const interval = 50
    let elapsed = 0
    const timer = setInterval(() => {
      elapsed += interval
      const raw = elapsed / duration
      // eased progress: fast start, slow mid, fast end
      const eased = raw < 0.3 ? raw * 2
        : raw < 0.7 ? 0.6 + (raw - 0.3) * 0.5
        : 0.8 + (raw - 0.7) * 0.67
      setProgress(Math.min(eased, 1))
      if (elapsed >= duration) {
        clearInterval(timer)
        setTimeout(() => {
          setPhaseIdx(i => i + 1)
          setProgress(0)
        }, 150)
      }
    }, interval)
    return () => clearInterval(timer)
  }, [phaseIdx, phases, onComplete])

  const overallProgress = ((phaseIdx + progress) / phases.length) * 100

  return (
    <div className="space-y-4">
      {/* Overall progress bar */}
      <div className="w-full h-1.5 bg-surface2 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-emerald-500 rounded-full"
          animate={{ width: `${overallProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Phase list */}
      <div className="space-y-2">
        {phases.map((phase, i) => {
          const Icon = phase.icon
          const isDone = i < phaseIdx
          const isActive = i === phaseIdx
          const isPending = i > phaseIdx

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: isPending ? 0.3 : 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-emerald-50' : ''
              }`}
            >
              {/* Status icon */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                isDone ? 'bg-emerald-500' :
                isActive ? 'bg-emerald-100 border-2 border-emerald-500' :
                'bg-surface2 border border-border'
              }`}>
                {isDone && <Check size={14} className="text-white" strokeWidth={3} />}
                {isActive && <Loader2 size={14} className="text-emerald-600 animate-spin" />}
                {isPending && <Icon size={12} className="text-muted3" />}
              </div>

              {/* Label */}
              <span className={`text-[13px] flex-1 ${
                isDone ? 'text-muted2 line-through' :
                isActive ? 'text-ink font-medium' :
                'text-muted3'
              }`}>{phase.label}</span>

              {/* Phase progress */}
              {isActive && (
                <span className="font-mono text-[11px] text-emerald-600 font-semibold">
                  {Math.round(progress * 100)}%
                </span>
              )}
              {isDone && (
                <span className="font-mono text-[10px] text-emerald-600">done</span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
