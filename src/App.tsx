import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Upload, ScanText, Scale, Calculator, Satellite, ArrowRight } from 'lucide-react'
import Step1Intake from './components/steps/Step1Intake'
import Step2OCR from './components/steps/Step2OCR'
import Step3Regulation from './components/steps/Step3Regulation'
import Step4CBAM from './components/steps/Step4CBAM'
import Step5Satellite from './components/steps/Step5Satellite'

type StepId = 1 | 2 | 3 | 4 | 5

const STEPS: { id: StepId; label: string; mono: string; icon: typeof Upload }[] = [
  { id: 1, label: 'Intake', mono: 'doc.upload', icon: Upload },
  { id: 2, label: 'OCR Parse', mono: 'ocr.extract', icon: ScanText },
  { id: 3, label: 'Regulation', mono: 'reg.triage', icon: Scale },
  { id: 4, label: 'CBAM', mono: 'cbam.calc', icon: Calculator },
  { id: 5, label: 'Satellite + CNN', mono: 'sat.verify', icon: Satellite },
]

export default function App() {
  const [started, setStarted] = useState(false)
  const [step, setStep] = useState<StepId>(1)
  const completedSteps = useRef<Set<StepId>>(new Set())
  const [prevDirection, setPrevDirection] = useState<'forward' | 'back'>('forward')
  const [clock, setClock] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const navigateStep = (targetStep: StepId) => {
    setPrevDirection(targetStep > step ? 'forward' : 'back')
    completedSteps.current.add(step)
    setStep(targetStep)
    document.getElementById('main-scroll')?.scrollTo({ top: 0, behavior: 'instant' })
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!started) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight' && step < 5) navigateStep((step + 1) as StepId)
      if (e.key === 'ArrowLeft' && step > 1) navigateStep((step - 1) as StepId)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [step, started])

  useEffect(() => {
    const label = started ? STEPS.find(s => s.id === step)?.label : 'EcoTrade'
    document.title = `${label} — EcoTrade`
  }, [step, started])

  // ─── Landing Screen ───────────────────────────────────────────────
  if (!started) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center max-w-[480px]"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <svg width={36} height={36} viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="#0A0A0A" strokeWidth="1.5" />
              <path d="M10 1v18M1 10h18" stroke="#0A0A0A" strokeWidth="1.5" />
              <circle cx="14" cy="6" r="1.5" fill="#0A0A0A" />
            </svg>
            <span className="font-heading font-bold text-[28px] text-ink tracking-tight">EcoTrade</span>
          </div>

          {/* Tagline */}
          <p className="text-[15px] text-muted2 leading-relaxed mb-2">
            EU 환경 규제 통합 컴플라이언스 플랫폼
          </p>
          <p className="text-[13px] text-muted3 mb-10">
            EUDR · CBAM · CSDDD — 서류 검증부터 위성 분석까지
          </p>

          {/* CTA */}
          <button
            onClick={() => setStarted(true)}
            className="px-8 py-3.5 bg-ink text-white rounded-lg text-[14px] font-semibold hover:bg-ink2 transition-colors active:scale-[0.98]"
          >
            새 케이스 시작
          </button>

          {/* Footer */}
          <div className="mt-16 font-mono text-[10px] text-muted3 space-y-1">
            <div>Team 유니하나 · 하나은행 대학생 연합</div>
            <div>v2.0 · {new Date().toISOString().slice(0, 10)}</div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ─── Main App ─────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[240px] border-r border-border bg-surface flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <svg width={22} height={22} viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="#0A0A0A" strokeWidth="1.5" />
              <path d="M10 1v18M1 10h18" stroke="#0A0A0A" strokeWidth="1.5" />
              <circle cx="14" cy="6" r="1.5" fill="#0A0A0A" />
            </svg>
            <span className="font-heading font-semibold text-[15px] text-ink tracking-tight">EcoTrade</span>
            <span className="ml-auto px-1.5 py-0.5 bg-surface2 rounded text-[9px] font-mono text-muted3">v2.0</span>
          </div>
        </div>

        {/* Case progress */}
        <div className="px-4 pb-3">
          <div className="bg-white border border-border rounded-lg px-3 py-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-ink">케이스 진행</span>
              <span className="font-mono text-[9px] text-muted3">{step}/5</span>
            </div>
            <div className="flex gap-1">
              {STEPS.map(s => (
                <div key={s.id} className={`flex-1 h-1.5 rounded-full ${
                  s.id < step ? 'bg-emerald-500' : s.id === step ? 'bg-ink' : 'bg-surface2'
                }`} />
              ))}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5 overflow-y-auto">
          <div className="px-2 pt-2 pb-2 font-mono text-[9px] text-muted3 uppercase tracking-[0.06em] font-semibold">Pipeline</div>
          {STEPS.map(s => {
            const active = s.id === step
            const done = s.id < step
            const StepIcon = s.icon
            return (
              <button key={s.id} onClick={() => navigateStep(s.id)}
                title={`${s.label} (${s.mono})`}
                className={`group relative flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left transition-all duration-200 text-[13px] active:scale-[0.98] ${
                  active ? 'bg-white border border-border shadow-sm font-medium text-ink' :
                  done ? 'text-ink hover:bg-white/60' : 'text-muted3 hover:text-muted2 hover:bg-surface2/50'
                }`}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full bg-ink" />}
                <div className={`w-[24px] h-[24px] rounded-md flex items-center justify-center shrink-0 transition-all duration-200 ${
                  done ? 'bg-emerald-500 text-white group-hover:scale-110' : active ? 'bg-ink text-white' : 'bg-surface2 text-muted3 border border-border group-hover:border-border2'
                }`}>
                  {done ? <span className="text-[10px] font-bold">✓</span> : <StepIcon size={12} />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block truncate">{s.label}</span>
                  {active && <span className="font-mono text-[9px] text-muted3">{s.mono}</span>}
                </div>
                {active && <ChevronRight size={12} className="text-muted3" />}
              </button>
            )
          })}

          <div className="px-2 pt-6 pb-2 font-mono text-[9px] text-muted3 uppercase tracking-[0.06em] font-semibold">Regulation</div>
          {[
            { label: 'CBAM', sub: '2026 Q1', active: false },
            { label: 'EUDR', sub: 'in force', active: true },
            { label: 'CSDDD', sub: '2027', active: false },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-muted2">
              <span className={`w-[7px] h-[7px] rounded-full ${r.active ? 'bg-amber-500' : 'bg-border2'}`} />
              <span>{r.label}</span>
              <span className="ml-auto font-mono text-[9px] text-muted3">{r.sub}</span>
            </div>
          ))}
        </nav>

        {/* Next step button */}
        {step < 5 && (
          <div className="px-4 pb-3">
            <button
              onClick={() => navigateStep((step + 1) as StepId)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-ink text-white rounded-lg text-[12px] font-semibold hover:bg-ink2 transition-colors active:scale-[0.98]"
            >
              {STEPS.find(s => s.id === step + 1)?.label}
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border px-4 py-3 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center text-[10px] font-semibold">UH</div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-ink font-medium truncate">Team 유니하나</div>
              <div className="font-mono text-[9px] text-muted3">ECO-{new Date().toISOString().slice(2,10).replace(/-/g,'')}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-muted3 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Synced {clock.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="border-b border-border bg-white shrink-0">
          <div className="h-[2px] bg-surface2">
            <motion.div className="h-full bg-ink" animate={{ width: `${(step / STEPS.length) * 100}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
          </div>
          <div className="h-[50px] flex items-center px-8 justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-muted3">Pipeline</span>
              <ChevronRight size={10} className="text-muted3" />
              <span className="font-heading text-[15px] font-semibold text-ink tracking-tight">
                {STEPS.find(s => s.id === step)?.label}
              </span>
              <span className="font-mono text-[9px] text-muted3 bg-surface2 px-1.5 py-0.5 rounded ml-1.5">
                {step}/{STEPS.length}
              </span>
            </div>
            <div className="flex items-center gap-5 font-mono text-[11px] text-muted2">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />ECO-{new Date().toISOString().slice(2,10).replace(/-/g,'')}-001</span>
              <span>Palm Oil · Central Kalimantan → EU</span>
              <span className="px-2 py-0.5 bg-surface2 rounded text-muted3">EUDR 2023/1115</span>
              <span className="text-muted3">{clock.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div id="main-scroll" className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait" onExitComplete={() => { document.getElementById('main-scroll')?.scrollTo({ top: 0 }) }}>
            <motion.div
              key={step}
              initial={{ opacity: 0, y: prevDirection === 'forward' ? 20 : -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: prevDirection === 'forward' ? -12 : 12 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {step === 1 && <Step1Intake skipLoading={completedSteps.current.has(1)} />}
              {step === 2 && <Step2OCR skipLoading={completedSteps.current.has(2)} />}
              {step === 3 && <Step3Regulation skipLoading={completedSteps.current.has(3)} />}
              {step === 4 && <Step4CBAM skipLoading={completedSteps.current.has(4)} />}
              {step === 5 && <Step5Satellite skipLoading={completedSteps.current.has(5)} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom bar */}
        <div className="h-[28px] border-t border-border bg-surface flex items-center px-8 gap-6 text-[9px] text-muted3 font-mono shrink-0 select-none">
          <span><kbd className="px-1 py-0.5 bg-white border border-border rounded text-[8px]">←</kbd> <kbd className="px-1 py-0.5 bg-white border border-border rounded text-[8px]">→</kbd> 단계 이동</span>
          <span className="ml-auto">EcoTrade v2.0 · EUDR/CBAM/CSDDD Compliance</span>
        </div>
      </main>
    </div>
  )
}
