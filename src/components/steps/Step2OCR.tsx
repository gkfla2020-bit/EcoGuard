import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanText, FileSearch, Brain, CheckCircle2, AlertTriangle, Layers } from 'lucide-react'
import PhaseLoader from '../shared/PhaseLoader'
import ConfidenceBar from '../shared/ConfidenceBar'
import type { Phase } from '../shared/PhaseLoader'

type ExtractedField = {
  field: string
  value: string
  confidence: number
  source: string
}

const OCR_PHASES: Phase[] = [
  { id: 'load', label: '문서 이미지 전처리...', icon: FileSearch, duration: 900 },
  { id: 'ocr', label: 'OCR 엔진 실행 중...', icon: ScanText, duration: 1500 },
  { id: 'nlp', label: 'NLP 필드 추출 중...', icon: Brain, duration: 1800 },
  { id: 'cross', label: '교차 검증 수행 중...', icon: Layers, duration: 1200 },
  { id: 'done', label: '추출 결과 정리...', icon: CheckCircle2, duration: 600 },
]

const BASE_RESULTS: ExtractedField[] = [
  { field: 'Exporter', value: 'PT. Sawit Kalimantan Utama', confidence: 97.2, source: 'Invoice p.1' },
  { field: 'Importer', value: 'UniHana Trading GmbH', confidence: 99.1, source: 'Invoice p.1' },
  { field: 'Product', value: 'Crude Palm Oil (CPO)', confidence: 98.4, source: 'Invoice p.1' },
  { field: 'HS Code', value: '1511.10.00', confidence: 99.5, source: 'B/L p.1' },
  { field: 'Quantity', value: '2,400 MT', confidence: 95.3, source: 'Invoice p.2' },
  { field: 'Origin GPS', value: '2.50°S, 111.79°E', confidence: 94.1, source: 'DDS Report p.3' },
  { field: 'Plantation ID', value: 'ISCC-ID-PKS-2024-0847', confidence: 96.8, source: 'Origin Cert p.1' },
  { field: 'Harvest Period', value: '2024-03-15 ~ 2024-04-02', confidence: 92.3, source: 'DDS Report p.5' },
  { field: 'ISCC Certificate', value: 'ISCC EU Plus (exp. 2025-12)', confidence: 97.0, source: 'Origin Cert p.1' },
  { field: 'Loading Port', value: 'Kumai, Central Kalimantan', confidence: 98.1, source: 'B/L p.1' },
  { field: 'Vessel Name', value: 'MV Green Pacific', confidence: 96.5, source: 'B/L p.1' },
  { field: 'ETA EU Port', value: '2024-05-28 (Rotterdam)', confidence: 93.7, source: 'B/L p.2' },
]

// Add slight jitter to confidence values on each render session to feel non-static
function jitterResults(results: ExtractedField[]): ExtractedField[] {
  return results.map(r => ({
    ...r,
    confidence: Math.min(99.9, Math.max(85, r.confidence + (Math.random() - 0.5) * 1.2))
  }))
}

export default function Step2OCR({ skipLoading = false }: { skipLoading?: boolean }) {
  const RESULTS = useMemo(() => jitterResults(BASE_RESULTS), [])
  const [phase, setPhase] = useState<'idle' | 'loading' | 'revealing' | 'done'>(skipLoading ? 'done' : 'idle')
  const [visibleCount, setVisibleCount] = useState(skipLoading ? RESULTS.length : 0)
  const [elapsed, setElapsed] = useState(skipLoading ? 4.2 : 0)
  const startTime = useRef(Date.now())

  // Live elapsed timer during loading/revealing
  useEffect(() => {
    if (phase === 'done') return
    const timer = setInterval(() => {
      setElapsed(+(((Date.now() - startTime.current) / 1000)).toFixed(1))
    }, 100)
    return () => clearInterval(timer)
  }, [phase])

  useEffect(() => {
    if (phase === 'revealing' && visibleCount < RESULTS.length) {
      // Variable reveal speed: some fields appear faster than others
      const delay = 120 + Math.random() * 180
      const t = setTimeout(() => setVisibleCount(c => c + 1), delay)
      return () => clearTimeout(t)
    }
    if (phase === 'revealing' && visibleCount >= RESULTS.length) {
      setTimeout(() => setPhase('done'), 600)
    }
  }, [phase, visibleCount, RESULTS.length])

  const avgConfidence = RESULTS.reduce((sum, r) => sum + r.confidence, 0) / RESULTS.length
  const lowConfidence = RESULTS.filter(r => r.confidence < 93)

  return (
    <section>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {phase !== 'idle' && (
          <div className="mb-4">
            <h2 className="font-heading text-[22px] font-bold text-ink tracking-tight">OCR 자동 추출</h2>
            <p className="text-[13px] text-muted2 mt-1">
              서류에서 기업명, HS코드, 수량, GPS 좌표 등 핵심 정보를 AI가 자동으로 읽어내고, 문서 간 불일치를 찾아냅니다.
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div key="idle" exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="border border-border rounded-card p-5 bg-white">
              <h2 className="font-heading text-[20px] font-bold text-ink tracking-tight mb-1">OCR 자동 추출</h2>
              <p className="text-[12px] text-muted2 mb-4">서류에서 핵심 정보를 AI가 읽어냅니다. 5개 문서 (12 pages)</p>
              <div className="flex gap-2">
                <button onClick={() => { startTime.current = Date.now(); setPhase('loading') }}
                  className="px-5 py-2.5 bg-ink text-white rounded-lg text-[13px] font-semibold hover:bg-ink2 transition-colors active:scale-[0.98] flex items-center gap-2">
                  <ScanText size={14} /> OCR 추출 실행
                </button>
                <button onClick={() => { setPhase('done'); setVisibleCount(RESULTS.length); setElapsed(4.2) }}
                  className="px-4 py-2.5 border border-border rounded-lg text-[12px] text-muted2 hover:bg-surface2 transition-colors">
                  결과 바로보기
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="border border-border rounded-card p-6 bg-white"
            >
              <div className="flex items-center gap-2 mb-4">
                <ScanText size={16} className="text-ink" />
                <span className="text-[13px] font-semibold text-ink">문서 파싱 중</span>
                <span className="font-mono text-[10px] text-muted3 ml-auto">5 documents · 12 pages</span>
              </div>
              <PhaseLoader phases={OCR_PHASES} onComplete={() => setPhase('revealing')} />
            </motion.div>
          )}

          {(phase === 'revealing' || phase === 'done') && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Summary bar */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span className="text-[12px] font-medium text-emerald-800">{RESULTS.length}개 필드 추출</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg">
                  <span className="text-[11px] text-muted2">평균 정확도</span>
                  <span className="font-mono text-[12px] font-bold text-ink">{avgConfidence.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg" title="수동 검증 없이 자동 처리된 비율">
                  <span className="text-[11px] text-muted2">STP</span>
                  <span className="font-mono text-[12px] font-bold text-emerald-700">{((RESULTS.length - lowConfidence.length) / RESULTS.length * 100).toFixed(0)}%</span>
                </div>
                {lowConfidence.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span className="text-[11px] text-amber-800">{lowConfidence.length}건 수동 검증 권장</span>
                  </div>
                )}
              </div>

              {/* Results table */}
              <div className="border border-border rounded-card overflow-hidden bg-white">
                <div className="grid grid-cols-[140px_1fr_100px_120px_60px] gap-0 px-5 py-2.5 border-b border-border bg-surface text-[10px] font-mono text-muted3 uppercase tracking-wide">
                  <span>Field</span>
                  <span>Extracted Value</span>
                  <span>Confidence</span>
                  <span>Source</span>
                  <span>Status</span>
                </div>
                <div className="divide-y divide-border">
                  {RESULTS.slice(0, visibleCount).map((item, i) => (
                    <motion.div
                      key={item.field}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`grid grid-cols-[140px_1fr_100px_120px_60px] gap-0 px-5 py-3 items-center transition-colors ${
                        item.confidence < 93 ? 'bg-amber-50/40' : 'hover:bg-surface/50'
                      }`}
                    >
                      <span className="font-mono text-[11px] text-muted2">{item.field}</span>
                      <span className={`text-[13px] font-medium ${item.confidence < 93 ? 'text-ink underline decoration-amber-300 decoration-2 underline-offset-2' : 'text-ink'}`}>{item.value}</span>
                      <ConfidenceBar value={item.confidence} />
                      <span className="font-mono text-[10px] text-muted3">{item.source}</span>
                      {item.confidence < 93 ? (
                        <button className="px-2 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">Review</button>
                      ) : (
                        <span className="text-[9px] text-emerald-600 font-mono">auto</span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Cross-validation panel */}
              {phase === 'done' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="mt-4 border border-border rounded-card p-5 bg-white"
                >
                  <div className="text-[12px] font-semibold text-ink mb-3 flex items-center gap-2">
                    <Layers size={14} />
                    교차 검증 결과
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { pair: 'Invoice ↔ B/L', fields: 4, match: 4 },
                      { pair: 'Invoice ↔ Origin Cert', fields: 3, match: 3 },
                      { pair: 'B/L ↔ DDS Report', fields: 5, match: 5 },
                    ].map(v => (
                      <div key={v.pair} className="px-3 py-2.5 rounded-lg bg-surface border border-border">
                        <div className="text-[11px] text-muted2 mb-1">{v.pair}</div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[14px] font-bold text-emerald-700">{v.match}/{v.fields}</span>
                          <span className="text-[10px] text-emerald-600 font-medium">ALL MATCH</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 다음 단계 안내 */}
              {phase === 'done' && (
                <div className="mt-4 bg-surface rounded-card border border-border p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[12px] font-semibold text-ink">추출 완료</div>
                    <div className="text-[11px] text-muted2 mt-0.5">다음 단계에서 이 데이터가 EU 규제를 충족하는지 자동 판정합니다.</div>
                  </div>
                  <div className="text-[10px] text-muted3 font-mono">→ Regulation</div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 font-mono text-[10px] text-muted3 flex gap-3">
          <span>OCR Engine: Claude Vision + Tesseract 5.0</span><span>·</span>
          <span>NLP: spaCy + custom NER</span><span>·</span>
          <span className="tabular-nums">처리 시간: {elapsed.toFixed(1)}s</span>
        </div>
      </motion.div>
    </section>
  )
}
