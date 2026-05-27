import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine, ReferenceDot } from 'recharts'
import { Lock, CheckCircle2, XCircle, AlertCircle, BarChart3, ArrowRight, Shield } from 'lucide-react'
import PhaseLoader from '../shared/PhaseLoader'
import type { Phase } from '../shared/PhaseLoader'

// ─── Data ───────────────────────────────────────────────────────────────────
const PHASE_IN: Record<number, number> = { 2026: 0.025, 2027: 0.05, 2028: 0.10, 2029: 0.225, 2030: 0.35, 2031: 0.475, 2032: 0.60, 2033: 0.80, 2034: 1.0 }
const YEARS = Object.keys(PHASE_IN).map(Number)

const SECTOR = { name: 'Palm Oil (CPO)', mean: 3.2, std: 0.8, benchmark: 1.8, euDefault: 4.5 }
const EF = 3.2
const VOLUME = 2400
const FX = 1450
const EU_PRICE_BASE = 87.5

// ─── Phases ─────────────────────────────────────────────────────────────────
const SCORING_PHASES: Phase[] = [
  { id: 'load', label: '업종 배출계수 DB 로딩...', icon: BarChart3, duration: 800 },
  { id: 'validate', label: '데이터 정합성 검증 중...', icon: Shield, duration: 1200 },
  { id: 'zscore', label: 'Z-score 이상치 탐지...', icon: AlertCircle, duration: 1000 },
  { id: 'score', label: '품질 스코어 산출 중...', icon: CheckCircle2, duration: 800 },
]

// ─── Helpers ────────────────────────────────────────────────────────────────
function simulateCosts(volume: number, fx: number, ef: number) {
  const scenarios: Record<string, number[]> = { actual: [], default_eu: [], benchmark: [] }
  YEARS.forEach((y, i) => {
    const price = EU_PRICE_BASE * (1.08 ** i)
    const phaseIn = PHASE_IN[y]
    const freeAlloc = SECTOR.benchmark * (1 - phaseIn)
    scenarios.actual.push(+(Math.max(0, ef - freeAlloc) * volume * price * phaseIn / 1e8 * fx).toFixed(2))
    scenarios.default_eu.push(+(Math.max(0, SECTOR.euDefault - freeAlloc) * volume * price * phaseIn / 1e8 * fx).toFixed(2))
    scenarios.benchmark.push(+(Math.max(0, SECTOR.benchmark - freeAlloc) * volume * price * phaseIn / 1e8 * fx).toFixed(2))
  })
  return scenarios
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function Step4CBAM({ skipLoading = false }: { skipLoading?: boolean }) {
  const [stage, setStage] = useState<'scoring' | 'score-result' | 'blockchain' | 'simulation'>(skipLoading ? 'simulation' : 'scoring')
  const initialChecks: { pass: boolean; msg: string }[] = [
    { pass: true, msg: `배출계수 ${EF} tCO₂/t — 업종 평균(${SECTOR.mean})의 ±2σ 이내 (z=0.0)` },
    { pass: true, msg: `EU 기본값(${SECTOR.euDefault}) 미만 — 실측 제출 시 연간 수십억 절감 가능` },
    { pass: true, msg: `에너지 사용량 12.0 GJ/t — 업종 범위 내 정상` },
    { pass: true, msg: `생산량 ${VOLUME.toLocaleString()}톤 — 합리적 범위 확인` },
    { pass: false, msg: `EU 벤치마크(${SECTOR.benchmark})의 1.78배 — 개선 여지 있음` },
  ]
  const [scoreChecks, setScoreChecks] = useState<{ pass: boolean; msg: string }[]>(skipLoading ? initialChecks : [])
  const [visibleChecks, setVisibleChecks] = useState(skipLoading ? initialChecks.length : 0)
  const [blockHash, setBlockHash] = useState(skipLoading ? 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2' : '')
  const [tamperValue, setTamperValue] = useState(EF.toString())
  const [tamperResult, setTamperResult] = useState<{ match: boolean; msg: string } | null>(null)
  const [simVolume, setSimVolume] = useState(VOLUME)
  const [simFx, setSimFx] = useState(FX)
  // Gaussian curve data for Recharts
  const gaussData = (() => {
    const s = SECTOR
    const xMin = Math.max(0, s.mean - 3.5 * s.std)
    const xMax = s.mean + 3.5 * s.std
    const gauss = (x: number) => Math.exp(-0.5 * ((x - s.mean) / s.std) ** 2)
    const points = []
    for (let i = 0; i <= 80; i++) {
      const x = xMin + (xMax - xMin) * i / 80
      points.push({ x: parseFloat(x.toFixed(2)), density: parseFloat(gauss(x).toFixed(4)) })
    }
    return points
  })()

  const score = 85

  // Auto-flow: scoring → result reveal
  const onScoringComplete = () => {
    setScoreChecks(initialChecks)
    setStage('score-result')
  }

  // Reveal checks one by one
  useEffect(() => {
    if (stage === 'score-result' && visibleChecks < scoreChecks.length) {
      const t = setTimeout(() => setVisibleChecks(c => c + 1), 250)
      return () => clearTimeout(t)
    }
    if (stage === 'score-result' && visibleChecks >= scoreChecks.length && visibleChecks > 0) {
      const t = setTimeout(() => {
        // Auto-record blockchain
        sha256(JSON.stringify({ ef: EF, score, company: 'UniHana', ts: '2026-05-23T14:30:00Z' })).then(h => {
          setBlockHash(h)
          setStage('blockchain')
        })
      }, 1200)
      return () => clearTimeout(t)
    }
  }, [stage, visibleChecks, scoreChecks.length])

  // Auto-advance to simulation
  useEffect(() => {
    if (stage === 'blockchain') {
      const t = setTimeout(() => setStage('simulation'), 3500)
      return () => clearTimeout(t)
    }
  }, [stage])

  // Gaussian density at user's EF value for ReferenceDot
  const userDensity = Math.exp(-0.5 * ((EF - SECTOR.mean) / SECTOR.std) ** 2)

  // Simulation data
  const costData = YEARS.map((y, i) => {
    const sc = simulateCosts(simVolume, simFx, EF)
    return { year: y, '실측 제출': sc.actual[i], 'EU 기본값': sc.default_eu[i], '벤치마크 달성': sc.benchmark[i], phaseIn: PHASE_IN[y] * 100 }
  })
  const finalSaving = (costData[costData.length - 1]['EU 기본값'] - costData[costData.length - 1]['실측 제출']).toFixed(1)

  const handleTamper = async () => {
    const val = parseFloat(tamperValue)
    const newHash = await sha256(JSON.stringify({ ef: val, score, company: 'UniHana', ts: '2026-05-23T14:30:00Z' }))
    const match = newHash === blockHash
    setTamperResult({ match, msg: match ? '해시 일치 — 변조 없음' : `해시 불일치 — 변조 감지! (0x${newHash.slice(0, 8)}... ≠ 0x${blockHash.slice(0, 8)}...)` })
  }

  return (
    <section>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-4">
          <h2 className="font-heading text-[22px] font-bold text-ink tracking-tight"><span title="CBAM: EU 탄소국경조정메커니즘. EU로 수입되는 제품에 탄소 비용을 부과하는 제도 (2026년 본격 시행)" className="cursor-help">CBAM</span> 비용 분석</h2>
          <p className="text-[13px] text-muted2 mt-1">EU에 수출할 때 <span title="내재 탄소: 제품 생산 과정에서 배출된 CO₂ 총량" className="underline decoration-dotted cursor-help">탄소 비용</span>을 얼마나 내야 하는지, 실측 데이터를 제출하면 얼마를 줄일 수 있는지 계산합니다.</p>
        </div>

        {/* 핵심 요약 */}
        <div className="mb-4 border border-border rounded-card bg-white p-4">
          <div className="text-[13px] font-semibold text-ink mb-2">비용 요약</div>
          <div className="grid grid-cols-3 gap-4 text-[12px]">
            <div>
              <div className="text-muted3 mb-0.5">미제출 시 (EU 기본값)</div>
              <div className="font-mono text-[16px] font-bold text-ink">4.5 <span className="text-[11px] font-normal text-muted2">tCO₂/t</span></div>
              <div className="text-muted3 text-[10px] mt-0.5">2034년 연 25.4억 원 부담</div>
            </div>
            <div>
              <div className="text-muted3 mb-0.5">실측 제출 시</div>
              <div className="font-mono text-[16px] font-bold text-ink">3.2 <span className="text-[11px] font-normal text-muted2">tCO₂/t</span></div>
              <div className="text-muted3 text-[10px] mt-0.5">2034년 연 18.0억 원 부담</div>
            </div>
            <div>
              <div className="text-muted3 mb-0.5">절감 효과</div>
              <div className="font-mono text-[16px] font-bold text-ink">7.3 <span className="text-[11px] font-normal text-muted2">억 원/년</span></div>
              <div className="text-muted3 text-[10px] mt-0.5">실측 데이터 검증·제출로 절감</div>
            </div>
          </div>
        </div>

        <div className="border border-border rounded-card bg-white p-6 space-y-8">

          {/* ═══ Module 1: Quality Score ═══ */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center text-[11px] font-bold">1</div>
              <span className="text-[14px] font-bold text-ink">AI 품질 스코어링</span>
              <span className="text-[12px] text-muted2">배출 데이터 신뢰성 검증</span>
            </div>

            <AnimatePresence mode="wait">
              {stage === 'scoring' && (
                <motion.div key="scoring" exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                  <PhaseLoader phases={SCORING_PHASES} onComplete={onScoringComplete} />
                </motion.div>
              )}

              {stage !== 'scoring' && (
                <motion.div key="score-done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <div className="grid grid-cols-[180px_1fr] gap-4 mb-4">
                    {/* Score */}
                    <div className="bg-surface rounded-card border border-border p-5 text-center">
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                        className="font-mono text-[48px] font-black text-ink leading-none"
                      >{score}</motion.div>
                      <div className="text-[10px] text-muted3 mt-1">/100</div>
                      <div className="text-[11px] font-semibold text-ink mt-2">✓ High Quality</div>
                    </div>
                    {/* Checks */}
                    <div className="bg-surface rounded-card border border-border p-4 space-y-2">
                      {scoreChecks.slice(0, visibleChecks).map((c, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="flex items-start gap-2 text-[12px]">
                          {c.pass ? <CheckCircle2 size={14} className="text-muted2 shrink-0 mt-0.5" /> : <XCircle size={14} className="text-muted3 shrink-0 mt-0.5" />}
                          <span className="text-muted2">{c.msg}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  {/* Gaussian distribution — Recharts */}
                  <div className="bg-surface rounded-card border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[12px] font-semibold text-ink">업종 배출계수 정규분포</div>
                      <div className="flex items-center gap-4 text-[10px] text-muted3">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-surface0 inline-block" /> 본건</span>
                        <span className="flex items-center gap-1.5"><span className="w-4 h-0 inline-block border-t-[2px] border-dashed border-red-500" /> EU 기본값</span>
                        <span className="flex items-center gap-1.5"><span className="w-4 h-0 inline-block border-t-[2px] border-dashed border-blue-500" /> 벤치마크</span>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={gaussData} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                        <defs>
                          <linearGradient id="gaussGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3f3f46" stopOpacity={0.12} />
                            <stop offset="100%" stopColor="#3f3f46" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                        <XAxis
                          dataKey="x" type="number"
                          domain={['dataMin', 'dataMax']}
                          tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#71717A' }}
                          axisLine={{ stroke: '#d4d4d8' }}
                          tickLine={{ stroke: '#d4d4d8' }}
                          label={{ value: 'tCO₂ / t product', position: 'bottom', offset: 0, fontSize: 10, fill: '#a1a1aa' }}
                        />
                        <YAxis hide domain={[0, 1.1]} />
                        <Tooltip
                          contentStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono', borderRadius: 8, border: '1px solid #e5e7eb' }}
                          formatter={(v: any) => [`${Number(v).toFixed(3)}`, '확률밀도']}
                          labelFormatter={(l) => `${l} tCO₂/t`}
                          cursor={{ stroke: '#a1a1aa', strokeWidth: 1 }}
                        />
                        <Area type="monotone" dataKey="density" stroke="#3f3f46" strokeWidth={2.5} fill="url(#gaussGrad)" dot={false} animationDuration={1200} />
                        <ReferenceLine x={SECTOR.euDefault} stroke="#71717a" strokeDasharray="6 4" strokeWidth={2} label={{ value: `EU 기본값 (${SECTOR.euDefault})`, position: 'top', fontSize: 11, fill: '#71717a', fontWeight: 600 }} />
                        <ReferenceLine x={SECTOR.benchmark} stroke="#d4d4d8" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: `벤치마크 (${SECTOR.benchmark})`, position: 'insideBottomRight', fontSize: 10, fill: '#d4d4d8' }} />
                        <ReferenceDot x={EF} y={userDensity} r={8} fill="#6366f1" stroke="#fff" strokeWidth={3} label={{ value: `본건: ${EF}`, position: 'top', fontSize: 12, fontWeight: 700, fill: '#0a0a0a', offset: 12 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <div className="text-[11px] text-muted2">
                        본 건의 배출계수 <span className="font-mono font-bold text-ink">{EF} tCO₂/t</span>은
                        업종 평균과 동일하며, EU 기본값({SECTOR.euDefault})보다 <span className="font-semibold text-ink">{((1 - EF/SECTOR.euDefault) * 100).toFixed(0)}% 낮습니다</span>.
                        실측 제출이 유리합니다.
                      </div>
                      <div className="text-[9px] text-muted3 font-mono shrink-0 ml-4">n=2,847 · ISCC</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ═══ Module 2: Blockchain ═══ */}
          <AnimatePresence>
            {(stage === 'blockchain' || stage === 'simulation') && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.4 }}>
                <div className="border-t border-border pt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center text-[11px] font-bold">2</div>
                    <span className="text-[14px] font-bold text-ink">블록체인 인증</span>
                    <span className="text-[12px] text-muted2">검증 이력 변조 불가 보관</span>
                  </div>

                  {/* Block chain visualization */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <div className="bg-surface border border-border rounded-lg px-4 py-2.5 text-center">
                      <div className="text-[10px] font-bold text-muted2">Block #1041</div>
                      <div className="font-mono text-[8px] text-muted3">0x7a3f...e2b1</div>
                    </div>
                    <ArrowRight size={14} className="text-muted2" />
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 150 }}
                      className="bg-surface border-2 border-ink rounded-lg px-4 py-2.5 text-center"
                    >
                      <div className="text-[10px] font-bold text-ink">Block #1042 (NEW)</div>
                      <div className="font-mono text-[8px] text-ink">0x{blockHash.slice(0, 8)}...{blockHash.slice(-4)}</div>
                    </motion.div>
                    <ArrowRight size={14} className="text-muted3" />
                    <div className="bg-surface border border-dashed border-border rounded-lg px-4 py-2.5 text-center">
                      <div className="text-[10px] font-bold text-muted3">Block #1043</div>
                      <div className="text-[8px] text-muted3">다음 블록...</div>
                    </div>
                  </div>

                  {/* Record content */}
                  <div className="bg-surface rounded-card border border-border p-4 font-mono text-[11px] leading-relaxed mb-4">
                    <div className="text-[11px] font-sans font-semibold text-ink mb-2 flex items-center gap-1.5"><Lock size={12} /> 온체인 기록 내용</div>
                    <div className="flex items-center gap-2"><span className="text-muted3">txHash:</span> <span className="text-ink truncate max-w-[360px]">0x{blockHash}</span><button onClick={() => navigator.clipboard.writeText('0x' + blockHash)} className="px-1.5 py-0.5 text-[8px] bg-surface2 border border-border rounded hover:bg-border transition-colors" title="복사">copy</button></div>
                    <div><span className="text-muted3">timestamp:</span> 2026-05-23T14:30:00Z</div>
                    <div><span className="text-muted3">company:</span> UniHana Trading GmbH</div>
                    <div><span className="text-muted3">product:</span> Palm Oil CPO (HS 1511.10)</div>
                    <div><span className="text-muted3">emission_factor:</span> {EF} tCO₂/t</div>
                    <div><span className="text-muted3">quality_score:</span> {score}/100</div>
                    <div><span className="text-muted3">verifier:</span> EcoTrade AI v2.0</div>
                  </div>

                  {/* Tamper detection */}
                  <div className="bg-surface rounded-card border border-border p-4">
                    <div className="text-[11px] font-semibold text-ink mb-2">변조 감지 테스트</div>
                    <p className="text-[11px] text-muted2 mb-3">배출계수를 변경하면 해시가 달라져 변조가 즉시 감지됩니다.</p>
                    <div className="flex items-center gap-2">
                      <input type="number" step="0.01" value={tamperValue} onChange={e => { setTamperValue(e.target.value); setTamperResult(null) }}
                        className="w-24 px-3 py-2 border border-border rounded-lg text-[12px] font-mono focus:outline-none focus:ring-2 focus:ring-ink/10" />
                      <button onClick={handleTamper} className="px-4 py-2 text-[11px] font-semibold rounded-lg bg-ink text-white hover:opacity-90 transition-all active:scale-[0.98]">
                        변조 검증
                      </button>
                      {tamperResult && (
                        <span className={`text-[11px] font-semibold flex items-center gap-1 ${tamperResult.match ? 'text-ink' : 'text-red-600'}`}>
                          {tamperResult.match ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                          {tamperResult.msg}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ Module 3: Simulation ═══ */}
          <AnimatePresence>
            {stage === 'simulation' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.4 }}>
                <div className="border-t border-border pt-8">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center text-[11px] font-bold">3</div>
                    <span className="text-[14px] font-bold text-ink">CBAM 비용 시뮬레이션</span>
                    <span className="text-[12px] text-muted2">2026–2034 연도별 비용 경로</span>
                    {+finalSaving > 0 && (
                      <span className="ml-auto text-[12px] font-semibold text-ink">실측 제출 시 2034년 연 {finalSaving}억 원 절감</span>
                    )}
                  </div>

                  {/* Sliders */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[11px] text-muted2">연간 수출량</span>
                        <motion.span key={simVolume} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="font-mono text-[12px] font-bold text-ink inline-block">{simVolume.toLocaleString()}톤</motion.span>
                      </div>
                      <input type="range" min={500} max={10000} step={100} value={simVolume} onChange={e => setSimVolume(Number(e.target.value))}
                        className="w-full h-1.5 bg-surface2 rounded-full appearance-none cursor-pointer accent-ink" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[11px] text-muted2">환율</span>
                        <motion.span key={simFx} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="font-mono text-[12px] font-bold text-ink inline-block">₩{simFx.toLocaleString()}/€</motion.span>
                      </div>
                      <input type="range" min={1200} max={1700} step={10} value={simFx} onChange={e => setSimFx(Number(e.target.value))}
                        className="w-full h-1.5 bg-surface2 rounded-full appearance-none cursor-pointer accent-ink" />
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="bg-surface rounded-card border border-border p-5 mb-4">
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={costData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                        <defs>
                          <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.12} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#71717A' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#a1a1aa' }} axisLine={false} tickLine={false} unit="억" />
                        <Tooltip
                          contentStyle={{ fontSize: 12, fontFamily: 'JetBrains Mono', borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                          formatter={(v: any) => [`${Number(v).toFixed(1)}억 원`]}
                          cursor={{ stroke: '#d4d4d8', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                        <Area type="monotone" dataKey="실측 제출" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradActual)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
                        <Line type="monotone" dataKey="EU 기본값" stroke="#a1a1aa" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: '#a1a1aa' }} />
                        <Line type="monotone" dataKey="벤치마크 달성" stroke="#d4d4d8" strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 3, fill: '#d4d4d8' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Table */}
                  <div className="bg-surface rounded-card border border-border overflow-hidden mb-4">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b-2 border-border bg-white">
                          <th className="text-left py-2.5 px-3 font-semibold text-muted2">연도</th>
                          <th className="text-left py-2.5 px-3 font-semibold text-muted2">폐지율</th>
                          <th className="text-left py-2.5 px-3 font-semibold text-ink">실측 제출</th>
                          <th className="text-left py-2.5 px-3 font-semibold text-muted2">EU 기본값</th>
                          <th className="text-left py-2.5 px-3 font-semibold text-muted2">벤치마크</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costData.map((row, i) => (
                          <motion.tr key={row.year} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                            className="border-b border-border hover:bg-white/60 transition-colors">
                            <td className="py-2 px-3 font-mono font-semibold text-ink">{row.year}</td>
                            <td className="py-2 px-3 font-mono text-muted3">{row.phaseIn.toFixed(1)}%</td>
                            <td className="py-2 px-3 font-mono text-ink font-medium">{row['실측 제출'].toFixed(1)}억</td>
                            <td className="py-2 px-3 font-mono text-muted2">{row['EU 기본값'].toFixed(1)}억</td>
                            <td className="py-2 px-3 font-mono text-muted3">{row['벤치마크 달성'].toFixed(1)}억</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Comparison */}
                  <div className="bg-surface rounded-card border border-border p-5">
                    <div className="text-[13px] font-semibold text-ink mb-3">2034년 기준 비용 비교</div>
                    <div className="flex items-end gap-6">
                      <div>
                        <div className="text-[12px] text-muted3 mb-1">기본값 적용</div>
                        <div className="font-mono text-[20px] font-bold text-ink">{costData[costData.length - 1]['EU 기본값'].toFixed(1)}<span className="text-[13px] font-normal text-muted2 ml-0.5">억</span></div>
                      </div>
                      <span className="text-muted3 text-[13px] pb-1">→</span>
                      <div>
                        <div className="text-[12px] text-muted3 mb-1">실측 제출</div>
                        <div className="font-mono text-[20px] font-bold text-ink">{costData[costData.length - 1]['실측 제출'].toFixed(1)}<span className="text-[13px] font-normal text-muted2 ml-0.5">억</span></div>
                      </div>
                      <span className="text-muted3 text-[13px] pb-1">=</span>
                      <div>
                        <div className="text-[12px] text-muted3 mb-1">연간 절감</div>
                        <div className="font-mono text-[20px] font-bold text-ink">{finalSaving}<span className="text-[13px] font-normal text-muted2 ml-0.5">억 원</span></div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border space-y-2 text-[12px] text-muted2">
                      <div>실측 데이터 제출 시 EU 기본값 대비 연 <span className="font-semibold text-ink">{finalSaving}억 원</span> 절감.</div>
                      <div>배출계수 0.4t 추가 감축(바이오매스 전환) 시 <span className="font-semibold text-ink">{(+finalSaving * 1.3).toFixed(1)}억 원</span>까지 가능.</div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-[11px] text-muted3">시뮬레이션 결과를 CBAM 신고서에 첨부 가능</span>
                      <button
                        onClick={() => {
                          const header = 'Year,Phase-in(%),Actual(억),EU Default(억),Benchmark(억)\n'
                          const rows = costData.map(r => `${r.year},${r.phaseIn.toFixed(1)},${r['실측 제출'].toFixed(2)},${r['EU 기본값'].toFixed(2)},${r['벤치마크 달성'].toFixed(2)}`).join('\n')
                          const blob = new Blob([header + rows], { type: 'text/csv' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `CBAM_Simulation_${new Date().toISOString().slice(0,10)}.csv`
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                        className="px-4 py-1.5 rounded-md border border-border text-[11px] font-medium text-muted2 hover:bg-surface2 hover:text-ink transition-colors active:scale-[0.98]"
                      >
                        CSV 내보내기
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 font-mono text-[10px] text-muted3 flex gap-3">
          <span>CBAM Reg. 2023/956</span><span>·</span>
          <span>Phase-in: 2026(2.5%) → 2034(100%)</span><span>·</span>
          <span>EU ETS 기준: €87.5/tCO₂</span><span>·</span>
          <span>SHA-256 on-chain</span>
        </div>
      </motion.div>
    </section>
  )
}
