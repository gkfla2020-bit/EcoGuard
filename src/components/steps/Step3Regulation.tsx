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
              className="max-w-[800px]"
            >
              {/* Report Header */}
              <div className="border-b border-border pb-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-[10px] text-muted3">Report ID: ECO-{new Date().toISOString().slice(2,10).replace(/-/g,'')}-001</div>
                  <div className="font-mono text-[10px] text-muted3">{new Date().toISOString().slice(0,10)}</div>
                </div>
                <h2 className="font-heading text-[20px] font-bold text-ink">Due Diligence Compliance Report</h2>
                <div className="text-[12px] text-muted2 mt-1">PT. Sawit Kalimantan Utama → UniHana Trading GmbH · CPO 2,400MT · HS 1511.10</div>
              </div>

              {/* 1. Executive Summary */}
              <div className="mb-8">
                <div className="text-[11px] font-mono text-muted3 mb-2">1.0 EXECUTIVE SUMMARY</div>
                <div className="border border-border rounded-lg p-4 bg-white">
                  <div className="text-[13px] text-ink leading-relaxed mb-3">
                    본 건은 EUDR, CBAM, CSDDD 3개 규제 {RULES.length}개 조항에 대해 검증을 수행하였습니다.
                    서류 기반 <span className="font-semibold">{counts.pass}개 조항 적합</span>, 위성 검증 관련 <span className="font-semibold">{counts.warn}개 조항 주의</span> 판정을 받았습니다.
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
                    <div><div className="font-mono text-[9px] text-muted3 uppercase">Compliant</div><div className="font-mono text-[20px] font-bold text-ink">{counts.pass}/{RULES.length}</div></div>
                    <div><div className="font-mono text-[9px] text-muted3 uppercase">Attention</div><div className="font-mono text-[20px] font-bold text-ink">{counts.warn}/{RULES.length}</div></div>
                    <div><div className="font-mono text-[9px] text-muted3 uppercase">Non-Compliant</div><div className="font-mono text-[20px] font-bold text-ink">{counts.fail}/{RULES.length}</div></div>
                  </div>
                </div>
              </div>

              {/* 2. Findings */}
              <div className="mb-8">
                <div className="text-[11px] font-mono text-muted3 mb-3">2.0 FINDINGS BY ARTICLE</div>
                <div className="space-y-2">
                  {activeRules.slice(0, visibleCount).map((rule, i) => (
                    <motion.div
                      key={`${rule.reg}-${rule.article}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="border border-border rounded-lg bg-white overflow-hidden"
                    >
                      <div
                        onClick={() => setExpanded(i === expanded ? null : i)}
                        className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${expanded === i ? 'bg-surface' : 'hover:bg-surface/50'}`}
                      >
                        <span className="font-mono text-[10px] text-muted3 w-[20px]">2.{i + 1}</span>
                        <span className="font-mono text-[10px] text-muted3 w-[44px]">{rule.reg}</span>
                        <span className="font-mono text-[11px] text-muted2 w-[80px]">{rule.article}</span>
                        <span className="flex-1 text-[13px] text-ink">{rule.desc}</span>
                        <span className="font-mono text-[10px] text-ink uppercase px-2 py-0.5 bg-surface2 rounded">{rule.status === 'pending' ? 'pending' : rule.status}</span>
                        <ChevronDown size={13} className={`text-muted3 transition-transform ${expanded === i ? 'rotate-180' : ''}`} />
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
                            <div className="px-4 pb-3 pt-1 border-t border-border">
                              <div className="grid grid-cols-[80px_1fr] gap-y-2 text-[12px] mt-2">
                                <span className="text-muted3">소견</span><span className="text-muted2">{rule.detail}</span>
                                <span className="text-muted3">근거</span><span className="font-mono text-muted2 text-[11px]">{rule.evidence}</span>
                                <span className="text-muted3">위반 시</span><span className="text-ink font-medium">{rule.penalty}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 3. Conclusion */}
              <div className="mb-6">
                <div className="text-[11px] font-mono text-muted3 mb-3">3.0 CONCLUSION</div>
                <div className="border border-border rounded-lg p-4 bg-white text-[13px] text-ink leading-relaxed">
                  본 케이스는 서류 기반 검증에서 {counts.pass}개 조항이 적합 판정을 받았으나, EUDR Art.3(산림전용 금지) 및 Art.10(Cutoff date) 항목은 위성 환경 검증 결과에 따라 최종 판정이 필요합니다.
                  위성 검증이 완료되면 본 보고서가 자동 업데이트됩니다.
                </div>
              </div>

              {/* Export */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="font-mono text-[10px] text-muted3">EUDR 2023/1115 · CBAM 2023/956 · CSDDD 2024/1760</div>
                <button
                  style={{ backgroundColor: '#0A0A0A', color: '#fff' }}
                  className="px-5 py-2.5 rounded-lg text-[12px] font-semibold hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  DDS 보고서 내보내기
                </button>
              </div>
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
