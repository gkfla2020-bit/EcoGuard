import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Upload, ScanText, Scale, Calculator, Satellite, ArrowRight } from 'lucide-react'
import Step1Intake from './components/steps/Step1Intake'
import Step2OCR from './components/steps/Step2OCR'
import Step3Regulation from './components/steps/Step3Regulation'
import Step4CBAM from './components/steps/Step4CBAM'
import Step5Satellite from './components/steps/Step5Satellite'

type StepId = 1 | 2 | 3 | 4 | 5

const STEPS: { id: StepId; label: string; mono: string; icon: typeof Upload; desc: string }[] = [
  { id: 1, label: 'Intake', mono: 'doc.upload', icon: Upload, desc: '서류 업로드' },
  { id: 2, label: 'OCR Parse', mono: 'ocr.extract', icon: ScanText, desc: '자동 추출' },
  { id: 3, label: 'CBAM', mono: 'cbam.calc', icon: Calculator, desc: '탄소 비용' },
  { id: 4, label: 'Satellite', mono: 'sat.verify', icon: Satellite, desc: '위성 검증' },
  { id: 5, label: 'Report', mono: 'report.gen', icon: Scale, desc: '통합 보고서' },
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
      <div className="h-screen bg-white flex flex-col">
        {/* Top bar */}
        <div className="h-12 border-b border-border/50 flex items-center px-10 justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="#0A0A0A" strokeWidth="1.5" />
              <path d="M10 1v18M1 10h18" stroke="#0A0A0A" strokeWidth="1.5" />
              <circle cx="14" cy="6" r="1.5" fill="#0A0A0A" />
            </svg>
            <span className="font-heading font-semibold text-[14px] text-ink">EcoTrade</span>
          </div>
          <span className="font-mono text-[10px] text-muted3">v2.0 · Team 유니하나</span>
        </div>

        {/* Main content — PPT style */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-[700px] w-full"
          >
            {/* Headline */}
            <h1 className="font-heading text-[36px] font-bold text-ink tracking-[-0.03em] leading-[1.1] mb-4">
              EU 환경 규제 대응을 위한<br />통합 컴플라이언스 플랫폼
            </h1>
            <p className="text-[14px] text-muted2 leading-[1.6] mb-8 max-w-[500px]">
              수입 서류 제출부터 위성 기반 산림전용 검증까지, 5단계 자동화 파이프라인으로
              EUDR·CBAM·CSDDD 규제를 한번에 대응합니다.
            </p>

            {/* Pipeline steps */}
            <div className="flex items-center mb-8">
              {['서류 접수', 'OCR 추출', 'CBAM 산정', '위성 검증', '통합 보고서'].map((label, i) => (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full border border-border2 flex items-center justify-center font-mono text-[10px] font-semibold text-ink">{i + 1}</div>
                    <span className="text-[10px] text-muted2 mt-1.5 whitespace-nowrap">{label}</span>
                  </div>
                  {i < 4 && <div className="w-10 h-[1px] bg-border2 mx-1.5 -mt-4" />}
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => setStarted(true)}
              style={{ backgroundColor: '#0A0A0A', color: '#fff' }}
              className="px-7 py-3 rounded-lg text-[14px] font-semibold transition-all active:scale-[0.98] hover:opacity-90"
            >
              시작하기
            </button>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="h-10 border-t border-border/50 flex items-center px-10 justify-between shrink-0">
          <div className="flex gap-4 font-mono text-[10px] text-muted3">
            <span>EUDR 2023/1115</span>
            <span>CBAM 2023/956</span>
            <span>CSDDD 2024/1760</span>
          </div>
          <span className="font-mono text-[10px] text-muted3">{new Date().toISOString().slice(0, 10)}</span>
        </div>
      </div>
    )
  }

  // ─── Main App ─────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] border-r border-border bg-surface flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-4 pt-4 pb-3">
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
                  s.id < step ? 'bg-ink' : s.id === step ? 'bg-ink' : 'bg-surface2'
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
                  done ? 'bg-ink text-white' : active ? 'bg-ink text-white' : 'bg-surface2 text-muted3 border border-border group-hover:border-border2'
                }`}>
                  {done ? <span className="text-[10px] font-bold">✓</span> : <StepIcon size={12} />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block truncate">{s.label}</span>
                  {active && <span className="text-[10px] text-muted3">{s.desc}</span>}
                  {done && <span className="font-mono text-[10px] text-muted2">done</span>}
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
              <span className={`w-[7px] h-[7px] rounded-full ${r.active ? 'bg-ink' : 'bg-border2'}`} />
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
              style={{ backgroundColor: '#0A0A0A', color: '#fff' }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-semibold hover:opacity-90 transition-all active:scale-[0.98]"
            >
              {STEPS.find(s => s.id === step + 1)?.desc}
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
            <span className="w-1.5 h-1.5 rounded-full bg-ink" />
            <span>{clock.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="border-b border-border bg-white shrink-0">
          <div className="h-[1.5px] bg-border/30">
            <motion.div className="h-full bg-ink" animate={{ width: `${(step / STEPS.length) * 100}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
          </div>
          <div className="h-12 flex items-center px-8 justify-between">
            <div className="flex items-center gap-1.5">
              <span onClick={() => navigateStep(1)} className="text-[12px] text-muted3 hover:text-ink cursor-pointer transition-colors">Pipeline</span>
              <ChevronRight size={10} className="text-muted3" />
              <span className="font-heading text-[15px] font-semibold text-ink tracking-tight">
                {STEPS.find(s => s.id === step)?.label}
              </span>
              <span className="font-mono text-[9px] text-muted3 bg-surface2 px-1.5 py-0.5 rounded ml-1.5">
                {step}/{STEPS.length}
              </span>
            </div>
            <div className="flex items-center gap-5 font-mono text-[11px] text-muted2">
              <span>ECO-{new Date().toISOString().slice(2,10).replace(/-/g,'')}-001</span>
              <span>Palm Oil · Central Kalimantan → EU</span>
              <span className="px-2 py-0.5 bg-surface2 rounded text-muted3">EUDR 2023/1115</span>
              <span className="text-muted3">{clock.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div id="main-scroll" className="flex-1 overflow-y-auto px-8 py-6 bg-surface">
          <div className="max-w-[900px]">
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
              {step === 3 && <Step4CBAM skipLoading={completedSteps.current.has(3)} />}
              {step === 4 && <Step5Satellite skipLoading={completedSteps.current.has(4)} />}
              {step === 5 && <Step3Regulation skipLoading={completedSteps.current.has(5)} satelliteCompleted={completedSteps.current.has(4)} />}
            </motion.div>
          </AnimatePresence>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="h-7 border-t border-border bg-surface flex items-center px-8 text-[9px] text-muted3 font-mono shrink-0 select-none">
          <span className="ml-auto">EcoTrade v2.0</span>
        </div>
      </main>
    </div>
  )
}
