import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
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
  const totalDuration = useRef(phases.reduce((s, p) => s + p.duration * (0.4 + Math.random() * 0.4), 0))

  useEffect(() => {
    if (phaseIdx >= phases.length) {
      onComplete()
      return
    }
    const duration = phases[phaseIdx].duration * (0.4 + Math.random() * 0.4)
    let elapsed = 0
    const interval = 60
    const timer = setInterval(() => {
      elapsed += interval
      const raw = Math.min(elapsed / duration, 1)
      setProgress(raw)
      if (elapsed >= duration) {
        clearInterval(timer)
        setTimeout(() => { setPhaseIdx(i => i + 1); setProgress(0) }, 80)
      }
    }, interval)
    return () => clearInterval(timer)
  }, [phaseIdx, phases, onComplete])

  const overallProgress = ((phaseIdx + progress) / phases.length) * 100
  const currentLabel = phaseIdx < phases.length ? phases[phaseIdx].label : 'Complete'

  return (
    <div className="space-y-3">
      {/* Single progress bar */}
      <div className="w-full h-1 bg-surface2 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-ink rounded-full"
          animate={{ width: `${overallProgress}%` }}
          transition={{ duration: 0.08 }}
        />
      </div>
      {/* Current status — single line, minimal */}
      <div className="flex items-center gap-2">
        <Loader2 size={13} className="text-muted3 animate-spin" />
        <span className="text-[12px] text-muted2">{currentLabel}</span>
        <span className="ml-auto font-mono text-[11px] text-muted3 tabular-nums">{Math.round(overallProgress)}%</span>
      </div>
    </div>
  )
}
