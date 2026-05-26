import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, BookOpen, ShieldCheck, ShieldAlert, ShieldX, ChevronDown, FileWarning, Gavel } from 'lucide-react'
import PhaseLoader from '../shared/PhaseLoader'
import type { Phase } from '../shared/PhaseLoader'

type RuleStatus = 'pass' | 'warn' | 'fail' | 'pending'

type Rule = {
  reg: string
  article: string
  desc: string
  status: RuleStatus
  detail: string
  evidence: string
  penalty: string
}

const TRIAGE_PHASES: Phase[] = [
  { id: 'load', label: '규제 DB 로딩 (EUDR/CBAM/CSDDD)...', icon: BookOpen, duration: 700 },
  { id: 'map', label: 'OCR 데이터 → 규제 조항 매핑...', icon: Scale, duration: 1400 },
  { id: 'eval', label: '조항별 적합성 평가 중...', icon: Gavel, duration: 2000 },
  { id: 'risk', label: '위험도 스코어링...', icon: FileWarning, duration: 1000 },
  { id: 'report', label: '판정 리포트 생성...', icon: ShieldCheck, duration: 800 },
]

const RULES: Rule[] = [
  { reg: 'EUDR', article: 'Art. 3(1)', desc: '산림전용 금지 의무', status: 'pending', detail: '위성 환경 검증(Step 5) 완료 후 판정 가능. CNN Segmentation + NDVI 분석 필요.', evidence: '→ Step 5 위성 검증 결과 대기', penalty: '수입 금지 + 매출액 4% 과징금' },
  { reg: 'EUDR', article: 'Art. 4(2)', desc: 'DDS 실사 보고서 제출', status: 'pass', detail: 'DDS 자체 실사 보고서 제출 확인. GPS polygon 포함, 공급망 정보 기재 적합.', evidence: 'DDS_SelfDeclaration.pdf (p.1-8)', penalty: '시장 진입 차단' },
  { reg: 'EUDR', article: 'Art. 9(1)(d)', desc: '지리적 좌표 (GPS polygon)', status: 'pass', detail: '원산지 GPS 좌표: 2.50°S, 111.79°E. GeoJSON polygon 4.2ha 범위 일치.', evidence: 'DDS Report p.3 + GPS polygon.geojson', penalty: '통관 보류' },
  { reg: 'EUDR', article: 'Art. 10(1)', desc: 'Cutoff date 이후 산림전용 없음', status: 'pending', detail: '2020-12-31 이후 산림전용 여부는 위성 시계열 분석으로 판정. Step 5 완료 필요.', evidence: '→ Step 5 NDVI 시계열 대기', penalty: '수입 금지 + 제품 회수' },
  { reg: 'EUDR', article: 'Art. 12', desc: '합법성 (현지법 준수)', status: 'pass', detail: '인도네시아 산림법 (PP 23/2021) 기반 HGU 허가 확인. ISCC EU 인증 유효.', evidence: 'Origin Cert + ISCC-ID-PKS-2024-0847', penalty: '형사 처벌 가능' },
  { reg: 'CBAM', article: 'Art. 35', desc: '내재 탄소배출량 보고', status: 'pass', detail: 'Scope 1+2 합산: 3.2 tCO₂/t. ISCC 기준 배출계수 적용. 보고 포맷 적합.', evidence: 'CBAM Declaration (Step 4)', penalty: '€100/tCO₂ 미보고 과태료' },
  { reg: 'CBAM', article: 'Annex III', desc: '간접 배출 (Scope 2) 보고', status: 'pass', detail: '전력 소비 기반 간접 배출: 0.35 tCO₂/t. 인도네시아 전력그리드 계수 적용.', evidence: 'Emission calc worksheet', penalty: 'EU 기본값 강제 적용' },
  { reg: 'CSDDD', article: 'Art. 7', desc: '공급망 인권·환경 실사', status: 'pass', detail: '소규모 농가 포함 공급망 리스트 제출. ILO 기본 조약 위반 사항 미확인.', evidence: 'DDS Report Annex C', penalty: '매출액 5% 과징금' },
  { reg: 'CSDDD', article: 'Art. 8', desc: '부정적 영향 방지 조치', status: 'pass', detail: 'RSPO 소규모 농가 지원 프로그램 참여 확인. 환경 복원 계획 첨부.', evidence: 'DDS Report Annex D', penalty: '민사 책임 + 기업 공시' },
]

export default function Step3Regulation({ skipLoading = false, satelliteCompleted = false }: { skipLoading?: boolean; satelliteCompleted?: boolean }) {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'revealing' | 'done'>(skipLoading ? 'done' : 'idle')
  const [visibleCount, setVisibleCount] = useState(skipLoading ? RULES.length : 0)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [filter, setFilter] = useState<RuleStatus | 'all'>('all')
  const [elapsed, setElapsed] = useState(skipLoading ? 5.9 : 0)

  // 위성 검증 완료 시 pending → warn 업데이트
  const activeRules = RULES.map(r =>
    r.status === 'pending' && satelliteCompleted
      ? { ...r, status: 'warn' as RuleStatus, detail: 'CNN 분석 결과 2020 이후 산림 31%p 감소. EUDR cutoff date 이후 산림전용 의심.', evidence: 'Step 5 CNN + NDVI 시계열' }
      : r
  )
  const startTime = useRef(Date.now())

  // Live elapsed timer
  useEffect(() => {
    if (phase === 'done') return
    const timer = setInterval(() => {
      setElapsed(+(((Date.now() - startTime.current) / 1000)).toFixed(1))
    }, 100)
    return () => clearInterval(timer)
  }, [phase])

  useEffect(() => {
    if (phase === 'revealing' && visibleCount < RULES.length) {
      // Variable timing: some rules evaluate faster than others
      const delay = 180 + Math.random() * 320
      const t = setTimeout(() => setVisibleCount(c => c + 1), delay)
      return () => clearTimeout(t)
    }
    if (phase === 'revealing' && visibleCount >= RULES.length) {
      setTimeout(() => setPhase('done'), 500)
    }
  }, [phase, visibleCount])

  const counts = {
    pass: activeRules.filter(r => r.status === 'pass').length,
    warn: activeRules.filter(r => r.status === 'warn').length,
    fail: activeRules.filter(r => r.status === 'fail').length,
  }

  const StatusIcon = ({ status }: { status: RuleStatus }) => {
    if (status === 'pass') return <ShieldCheck size={16} className="text-ink" />
    if (status === 'warn') return <ShieldAlert size={16} className="text-ink" />
    if (status === 'pending') return <ShieldAlert size={16} className="text-muted3" />
    return <ShieldX size={16} className="text-ink" />
  }

  return (
    <section>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {phase !== 'idle' && (
          <div className="mb-4">
            <h2 className="font-heading text-[22px] font-bold text-ink tracking-tight">통합 컴플라이언스 보고서</h2>
            <p className="text-[13px] text-muted2 mt-1">
              서류 검증, CBAM 탄소 분석, 위성 환경 검증 결과를 종합하여 EUDR/CBAM/CSDDD 규제별 적합성을 최종 판정합니다.
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div key="idle" exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="border border-border rounded-card p-5 bg-white">
              <h2 className="font-heading text-[20px] font-bold text-ink tracking-tight mb-1">통합 컴플라이언스 보고서</h2>
              <p className="text-[12px] text-muted2 mb-4">모든 검증 결과를 종합하여 {RULES.length}개 규제 조항 최종 판정을 생성합니다.</p>
              <div className="flex gap-2">
                <button onClick={() => { startTime.current = Date.now(); setPhase('loading') }}
                  style={{ backgroundColor: "#0A0A0A", color: "#fff" }} className="px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:opacity-90 transition-all active:scale-[0.98] flex items-center gap-2">
                  <Scale size={14} /> 보고서 생성
                </button>
                <button onClick={() => { setPhase('done'); setVisibleCount(RULES.length); setElapsed(5.9) }}
                  className="px-4 py-2.5 border border-border rounded-lg text-[12px] text-muted2 hover:bg-surface2 hover:text-ink hover:border-border2 transition-all">
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
                <Scale size={16} className="text-ink" />
                <span className="text-[13px] font-semibold text-ink">보고서 생성 중</span>
                <span className="font-mono text-[10px] text-muted3 ml-auto">3 regulations · 9 articles</span>
              </div>
              <PhaseLoader phases={TRIAGE_PHASES} onComplete={() => setPhase('revealing')} />
            </motion.div>
          )}

          {(phase === 'revealing' || phase === 'done') && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Summary */}
              <div className="flex items-center gap-6 mb-5 pb-4 border-b border-border">
                {[
                  { label: 'PASS', count: counts.pass, key: 'pass' as RuleStatus },
                  { label: 'WARNING', count: counts.warn, key: 'warn' as RuleStatus },
                  { label: 'FAIL', count: counts.fail, key: 'fail' as RuleStatus },
                ].map(s => {
                  const isActive = filter === s.key
                  return (
                    <button
                      key={s.label}
                      onClick={() => setFilter(isActive ? 'all' : s.key)}
                      className={`text-left transition-all ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                    >
                      <div className="font-mono text-[9px] text-muted3 uppercase tracking-wide">{s.label}</div>
                      <div className="font-heading text-[24px] font-bold text-ink">{s.count}</div>
                    </button>
                  )
                })}
                <div className="ml-auto font-mono text-[10px] text-muted3">{RULES.length} articles</div>
              </div>

              {/* Rules list */}
              <div className="border border-border rounded-card overflow-hidden bg-white">
                <div className="px-5 py-3 border-b border-border bg-surface flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-ink">조항별 판정 결과</span>
                  <div className="flex gap-2">
                    {['EUDR', 'CBAM', 'CSDDD'].map(r => (
                      <span key={r} className="px-2 py-0.5 bg-white border border-border rounded text-[10px] font-mono text-muted2">{r}</span>
                    ))}
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {activeRules.slice(0, visibleCount).filter(r => filter === 'all' || r.status === filter).map((rule, i) => (
                    <motion.div
                      key={`${rule.reg}-${rule.article}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div
                        onClick={() => setExpanded(i === expanded ? null : i)}
                        className={`px-5 py-3.5 flex items-center gap-4 cursor-pointer transition-colors ${
                          expanded === i ? 'bg-blue-50/60 border-l-2 border-l-blue-500 pl-[18px]' : 'hover:bg-surface/50'
                        }`}
                      >
                        <StatusIcon status={rule.status} />
                        <span className="w-[52px] shrink-0 font-mono text-[10px] text-muted3 uppercase font-semibold">{rule.reg}</span>
                        <span className="w-[90px] shrink-0 font-mono text-[11px] text-muted2">{rule.article}</span>
                        <span className="flex-1 text-[13px] text-ink">{rule.desc}</span>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase ${
                          rule.status === 'pass' ? 'bg-surface2 text-ink' :
                          rule.status === 'warn' ? 'border border-border text-ink' :
                          rule.status === 'pending' ? 'bg-surface2 text-muted3' : 'border border-border text-ink'
                        }`}>{rule.status === 'pending' ? '대기' : rule.status}</span>
                        <ChevronDown size={14} className={`text-muted3 transition-transform ${expanded === i ? 'rotate-180' : ''}`} />
                      </div>
                      <AnimatePresence>
                        {expanded === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-4 pl-[88px]">
                              <div className="bg-surface rounded-lg p-3 space-y-2">
                                <p className="text-[12px] text-muted2">{rule.detail}</p>
                                <div className="flex items-center gap-4 text-[10px]">
                                  <span><span className="text-muted3">근거:</span> <span className="font-mono text-muted2">{rule.evidence}</span></span>
                                  <span><span className="text-muted3">위반 시:</span> <span className="font-semibold text-red-600">{rule.penalty}</span></span>
                                  {rule.status === 'pending' && (
                                    <span className="ml-auto text-blue-600 font-medium cursor-pointer hover:underline">Step 5에서 검증 →</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Overall verdict */}
              {phase === 'done' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="mt-4 border border-border rounded-card p-4 bg-surface flex items-center gap-4"
                >
                  <ShieldAlert size={20} className="text-ink shrink-0" />
                  <div>
                    <div className="text-[13px] font-semibold text-ink">종합 판정: 서류 적합 · 위성 검증 대기</div>
                    <div className="text-[11px] text-muted2 mt-0.5">
                      서류 기반 7개 조항 PASS. EUDR Art.3, Art.10은 위성 환경 검증(Step 5) 완료 후 최종 판정.
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 최종 CTA */}
              {phase === 'done' && (
                <div className="mt-4 p-4 rounded-card flex items-center justify-between" style={{ backgroundColor: '#0A0A0A' }}>
                  <div>
                    <div className="text-[13px] font-semibold text-white">컴플라이언스 검증 완료</div>
                    <div className="text-[11px] text-white/60 mt-0.5">모든 파이프라인 결과가 반영된 최종 DDS 보고서를 내보낼 수 있습니다.</div>
                  </div>
                  <button className="px-5 py-2.5 bg-white text-ink rounded-lg text-[12px] font-semibold hover:bg-white/90 transition-colors active:scale-[0.98]">
                    DDS 보고서 내보내기
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 font-mono text-[10px] text-muted3 flex gap-3">
          <span>Rule Engine v2.1</span><span>·</span>
          <span>EUDR 2023/1115 · CBAM 2023/956 · CSDDD 2024/1760</span><span>·</span>
          <span className="tabular-nums">심사 시간: {elapsed.toFixed(1)}s</span>
        </div>
      </motion.div>
    </section>
  )
}
