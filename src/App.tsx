import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronRight, Upload, ScanText, Scale, Calculator, Satellite, ArrowRight } from 'lucide-react'
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
  const [step, setStep] = useState<StepId>(1)

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

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 px-2.5 py-[7px] bg-white border border-border rounded-lg font-mono text-[11px] text-muted2 hover:border-border2 transition-colors cursor-pointer">
            <Search size={12} className="text-muted3" />
            Search...
            <span className="ml-auto px-1.5 py-0.5 bg-surface2 rounded text-[9px] text-muted3">⌘K</span>
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
              <button key={s.id} onClick={() => setStep(s.id)}
                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left transition-all text-[13px] ${
                  active ? 'bg-white border border-border shadow-sm font-medium text-ink' :
                  done ? 'text-ink hover:bg-white/50' : 'text-muted3 hover:text-muted2'
                }`}>
                <div className={`w-[24px] h-[24px] rounded-md flex items-center justify-center shrink-0 transition-all ${
                  done ? 'bg-emerald-500 text-white' : active ? 'bg-ink text-white' : 'bg-surface2 text-muted3 border border-border'
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
              onClick={() => setStep((step + 1) as StepId)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-ink text-white rounded-lg text-[12px] font-semibold hover:bg-ink2 transition-colors active:scale-[0.98]"
            >
              Next Step
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center text-[10px] font-semibold">UH</div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-ink font-medium truncate">Team 유니하나</div>
              <div className="font-mono text-[9px] text-muted3">ECO-2026-0523</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-[52px] border-b border-border bg-white flex items-center px-8 justify-between shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-heading text-[16px] font-semibold text-ink tracking-tight">
              {STEPS.find(s => s.id === step)?.label}
            </span>
            <span className="font-mono text-[10px] text-muted3 bg-surface2 px-2 py-0.5 rounded">
              step {step} / {STEPS.length}
            </span>
          </div>
          <div className="flex items-center gap-5 font-mono text-[11px] text-muted2">
            <span>ECO-2026-0523-001</span>
            <span>Palm Oil · Central Kalimantan → EU</span>
            <span className="px-2 py-0.5 bg-surface2 rounded text-muted3">EUDR 2023/1115</span>
          </div>
        </header>

        {/* Content with AnimatePresence */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              {step === 1 && <Step1Intake />}
              {step === 2 && <Step2OCR />}
              {step === 3 && <Step3Regulation />}
              {step === 4 && <Step4CBAM />}
              {step === 5 && <Step5Satellite />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
