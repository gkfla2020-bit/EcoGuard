import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Satellite, Loader2, ScanSearch, BarChart3, FileCheck, AlertTriangle, MapPin, Play, Pause } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip, ResponsiveContainer } from 'recharts'
import PhaseLoader from '../shared/PhaseLoader'
import type { Phase } from '../shared/PhaseLoader'

type View = 'seg' | 'cam'

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024] as const
const STATS: Record<number, {forest:number, farm:number, bare:number, urban:number}> = {
  2019: {forest:78, farm:16, bare:3, urban:3},
  2020: {forest:76, farm:17, bare:4, urban:3},
  2021: {forest:71, farm:20, bare:5, urban:4},
  2022: {forest:63, farm:25, bare:8, urban:4},
  2023: {forest:54, farm:30, bare:11, urban:5},
  2024: {forest:47, farm:34, bare:14, urban:5},
}

const NDVI_DATA = [
  { year: '2019', ndvi: 0.72, min: 0.65, max: 0.78 },
  { year: '2020', ndvi: 0.71, min: 0.63, max: 0.77 },
  { year: '2021', ndvi: 0.67, min: 0.58, max: 0.74 },
  { year: '2022', ndvi: 0.61, min: 0.52, max: 0.69 },
  { year: '2023', ndvi: 0.55, min: 0.45, max: 0.64 },
  { year: '2024', ndvi: 0.50, min: 0.41, max: 0.60 },
]

const ANALYSIS_PHASES: Phase[] = [
  { id: 'connect', label: 'Sentinel-2 Copernicus API 연결 중...', icon: Satellite, duration: 1200 },
  { id: 'download', label: '위성 타일 다운로드 (Band 4, 8, 11)...', icon: Loader2, duration: 1800 },
  { id: 'segment', label: 'U-Net CNN Segmentation 추론 중...', icon: ScanSearch, duration: 2200 },
  { id: 'gradcam', label: 'Grad-CAM Saliency Map 생성 중...', icon: BarChart3, duration: 1500 },
  { id: 'ndvi', label: 'NDVI 시계열 계산 (NIR−Red)/(NIR+Red)...', icon: FileCheck, duration: 1000 },
]

export default function Step5Satellite({ skipLoading = false }: { skipLoading?: boolean }) {
  const [appPhase, setAppPhase] = useState<'loading' | 'done'>(skipLoading ? 'done' : 'loading')
  const [year, setYear] = useState<number>(2020)
  const [view, setView] = useState<View>('seg')
  const [playing, setPlaying] = useState(false)
  const [imageTransition, setImageTransition] = useState(false)
  const [visibleBars, setVisibleBars] = useState(skipLoading ? NDVI_DATA.length : 0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Preload all satellite images
  useEffect(() => {
    YEARS.forEach(yr => {
      ['orig', 'seg', 'overlay'].forEach(prefix => {
        const img = new Image()
        img.src = `/satellite/${prefix}_${yr}.png`
      })
    })
  }, [])

  // Timeline auto-play
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setYear(prev => {
          const idx = YEARS.indexOf(prev as any)
          if (idx >= YEARS.length - 1) {
            setPlaying(false)
            return prev
          }
          return YEARS[idx + 1]
        })
      }, 2500)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [playing])

  // Image transition effect
  useEffect(() => {
    setImageTransition(true)
    const t = setTimeout(() => setImageTransition(false), 400)
    return () => clearTimeout(t)
  }, [year, view])

  // NDVI bars reveal after loading
  useEffect(() => {
    if (appPhase === 'done' && visibleBars < NDVI_DATA.length) {
      const t = setTimeout(() => setVisibleBars(c => c + 1), 300)
      return () => clearTimeout(t)
    }
  }, [appPhase, visibleBars])

  const s = STATS[year]
  const change = s.forest - 78
  const risk = s.forest < 50 ? 'High' : s.forest < 65 ? 'Medium' : 'Low'
  const currentNdvi = NDVI_DATA.find(d => d.year === String(year))?.ndvi || 0.5

  const startTimeline = () => {
    setYear(2019)
    setPlaying(true)
  }

  return (
    <section>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h2 className="font-heading text-[22px] font-bold text-ink tracking-tight">위성 환경 검증</h2>
          <p className="text-[13px] text-muted2 mt-1">
            Sentinel-2 위성 이미지 기반 CNN Segmentation + Grad-CAM 분석으로 산림전용 여부를 검증합니다.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {appPhase === 'loading' && (
            <motion.div
              key="loading"
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="border border-border rounded-card p-6 bg-white"
            >
              <div className="flex items-center gap-2 mb-4">
                <Satellite size={16} className="text-ink" />
                <span className="text-[13px] font-semibold text-ink">위성 분석 파이프라인</span>
                <span className="font-mono text-[10px] text-muted3 ml-auto">6 years · 12 tiles · U-Net + Grad-CAM</span>
              </div>
              <PhaseLoader phases={ANALYSIS_PHASES} onComplete={() => setAppPhase('done')} />
            </motion.div>
          )}

          {appPhase === 'done' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Controls bar */}
              <div className="flex items-center gap-3 mb-4">
                {/* Year selector */}
                <div className="flex gap-1.5">
                  {YEARS.map(yr => {
                    const active = year === yr
                    const yrRisk = STATS[yr].forest < 50 ? 'high' : STATS[yr].forest < 65 ? 'mid' : 'low'
                    return (
                      <button key={yr} onClick={() => { setYear(yr); setPlaying(false) }}
                        className={`relative px-3.5 py-2 rounded-lg font-mono text-[12px] font-semibold transition-all active:scale-[0.96] ${
                          active ? 'bg-ink text-white shadow-sm' : 'bg-white border border-border text-muted2 hover:border-border2 hover:text-ink'
                        }`}>
                        {yr}
                        <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          yrRisk === 'high' ? 'bg-red-500' : yrRisk === 'mid' ? 'bg-amber-400' : 'bg-emerald-500'
                        }`} />
                      </button>
                    )
                  })}
                </div>

                {/* Timeline play */}
                <button
                  onClick={playing ? () => setPlaying(false) : startTimeline}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all active:scale-[0.96] ${
                    playing ? 'bg-red-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {playing ? <><Pause size={13} /> 정지</> : <><Play size={13} /> 타임라인 재생</>}
                </button>

                {/* View toggle */}
                <div className="ml-auto flex items-center gap-1 bg-surface2 rounded-lg p-1">
                  {(['seg', 'cam'] as const).map(v => (
                    <button key={v} onClick={() => setView(v)}
                      className={`px-3.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                        view === v ? 'bg-white text-ink shadow-sm' : 'text-muted2 hover:text-ink'
                      }`}>
                      {v === 'seg' ? 'Segmentation' : 'Grad-CAM'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image comparison panel */}
              <div className="border border-border rounded-card overflow-hidden bg-white shadow-card">
                {/* Header */}
                <div className="grid grid-cols-2 border-b border-border">
                  <div className="px-4 py-2.5 text-[12px] font-semibold text-ink flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><MapPin size={12} /> 위성 관측 ({year})</span>
                    <span className="font-mono text-[10px] text-muted3">2.50°S 111.79°E</span>
                  </div>
                  <div className="px-4 py-2.5 text-[12px] font-semibold border-l border-border flex items-center justify-between">
                    <span className={view === 'cam' ? 'text-purple-700' : 'text-ink'}>
                      {view === 'seg' ? 'CNN Segmentation' : 'Grad-CAM Saliency'}
                    </span>
                    <span className="font-mono text-[10px] text-muted3">U-Net ResNet34</span>
                  </div>
                </div>

                {/* Images with transition */}
                <div className="grid grid-cols-2" style={{ height: 420 }}>
                  {/* Left: satellite */}
                  <div className="relative border-r border-border bg-neutral-900 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={`orig-${year}`}
                        src={`/satellite/orig_${year}.png`}
                        alt={`Satellite ${year}`}
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                      />
                    </AnimatePresence>
                    {/* Year + acquisition metadata overlay */}
                    <div className="absolute top-3 left-3 bg-black/80 text-white font-mono text-[11px] px-3 py-1.5 rounded-md backdrop-blur-sm">
                      <div className="font-bold text-[13px]">{year}</div>
                      <div className="text-[9px] text-white/60 mt-0.5">S2A · {year}-07-{12 + (year % 5)} · L2A</div>
                    </div>
                    {/* Scan line animation when transitioning */}
                    {imageTransition && (
                      <motion.div
                        className="absolute left-0 right-0 h-[2px] bg-emerald-400/80 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                        initial={{ top: 0 }}
                        animate={{ top: '100%' }}
                        transition={{ duration: 0.4, ease: 'linear' }}
                      />
                    )}
                  </div>

                  {/* Right: analysis result */}
                  <div className="relative bg-neutral-900 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={`result-${year}-${view}`}
                        src={view === 'seg' ? `/satellite/seg_${year}.png` : `/satellite/overlay_${year}.png`}
                        alt={`${view} ${year}`}
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0, scale: 1.02, filter: 'brightness(1.2)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'brightness(1)' }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                      />
                    </AnimatePresence>
                    {/* Label overlay */}
                    <div className="absolute top-3 left-3 bg-black/80 text-white font-mono text-[13px] font-bold px-3 py-1.5 rounded-md backdrop-blur-sm">
                      {year} · {view === 'seg' ? 'Seg' : 'CAM'}
                    </div>
                    {/* Segmentation border reveal animation */}
                    {imageTransition && (
                      <motion.div
                        className="absolute inset-0 border-[3px] border-emerald-400/60 rounded-sm"
                        initial={{ opacity: 1, scale: 1.05 }}
                        animate={{ opacity: 0, scale: 1 }}
                        transition={{ duration: 0.6 }}
                      />
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div className="border-t border-border px-5 py-2.5 flex items-center gap-5 text-[11px] bg-surface">
                  {view === 'seg' ? (
                    <>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{background:'#228B22'}} /> 산림</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{background:'#DAA520'}} /> 농지</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{background:'#B22222'}} /> 나지/벌채</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{background:'#A9A9A9'}} /> 도시</span>
                    </>
                  ) : (
                    <span className="text-muted2">보라/마젠타 = CNN이 산림 훼손으로 판단한 근거 영역. 밝을수록 확신도 높음.</span>
                  )}
                  {playing && <span className="ml-auto text-blue-600 font-semibold animate-pulse">● 자동 재생 중</span>}
                </div>
              </div>

              {/* Stats + Verdict */}
              <div className="mt-4 flex gap-3">
                <div className="flex-1 border border-border rounded-card grid grid-cols-5 divide-x divide-border bg-white">
                  {[
                    { l: 'Forest', v: `${s.forest}%`, c: s.forest < 50 ? 'text-red-600' : 'text-emerald-700' },
                    { l: 'Farmland', v: `${s.farm}%`, c: 'text-amber-600' },
                    { l: 'Bare', v: `${s.bare}%`, c: s.bare > 10 ? 'text-red-600' : 'text-muted2' },
                    { l: 'Urban', v: `${s.urban}%`, c: 'text-muted2' },
                    { l: 'Δ Forest', v: `${change > 0 ? '+' : ''}${change}%`, c: change < -10 ? 'text-red-600' : 'text-emerald-700' },
                  ].map(k => (
                    <motion.div key={k.l} className="px-3 py-3" layout>
                      <div className="font-mono text-[9px] text-muted3 uppercase tracking-wide">{k.l}</div>
                      <motion.div
                        key={`${k.l}-${k.v}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`font-mono text-[20px] font-medium mt-0.5 ${k.c}`}
                      >
                        {k.v}
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  key={`verdict-${year}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`w-[200px] border-2 rounded-card px-4 py-3 bg-white ${
                    risk === 'High' ? 'border-red-400' : risk === 'Medium' ? 'border-amber-400' : 'border-emerald-400'
                  }`}
                >
                  <div className="font-mono text-[9px] text-muted2 uppercase tracking-wide mb-0.5">Verdict ({year})</div>
                  <div className={`font-heading text-[15px] font-bold ${
                    risk === 'High' ? 'text-red-600' : risk === 'Medium' ? 'text-amber-600' : 'text-emerald-700'
                  }`}>{risk} Risk</div>
                  <p className="text-[10px] text-muted2 mt-0.5">
                    {risk === 'High' ? `산림 ${Math.abs(change)}% 감소` :
                     risk === 'Medium' ? '산림 감소 진행 중' : 'Compliant'}
                  </p>
                </motion.div>
              </div>

              {/* NDVI Panel */}
              <div className="mt-4 grid grid-cols-[1fr_320px] gap-4">
                {/* NDVI Chart */}
                <div className="border border-border rounded-card bg-white p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[13px] font-semibold text-ink">NDVI 시계열 추이</div>
                      <div className="text-[11px] text-muted2 mt-0.5">Normalized Difference Vegetation Index · 2019–2024</div>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted3">
                      <span className="flex items-center gap-1"><span className="w-3 h-[2px] bg-emerald-500 inline-block" /> NDVI</span>
                      <span className="flex items-center gap-1"><span className="w-4 h-0 inline-block border-t border-dashed border-red-400" /> 임계(0.6)</span>
                      <span className="flex items-center gap-1"><span className="w-4 h-0 inline-block border-t border-dashed border-amber-400" /> 기준일</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={NDVI_DATA} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#71717A' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                      <YAxis domain={[0.35, 0.85]} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickCount={6} />
                      <Tooltip contentStyle={{ fontSize: 12, fontFamily: 'JetBrains Mono', borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={(value) => [Number(value).toFixed(3), 'NDVI']} />
                      <ReferenceLine y={0.6} stroke="#ef4444" strokeDasharray="6 4" strokeWidth={1.5} />
                      <ReferenceLine x="2020" stroke="#d97706" strokeDasharray="4 4" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="ndvi" stroke="#10b981" strokeWidth={2.5} fill="url(#ndviGrad)" dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, fill: '#059669' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* NDVI Bars (animated reveal) */}
                <div className="border border-border rounded-card bg-white p-5">
                  <div className="text-[12px] font-semibold text-ink mb-3 flex items-center gap-1.5">
                    <BarChart3 size={13} className="text-emerald-600" />
                    NDVI 월별 지수
                  </div>
                  <div className="space-y-2">
                    {NDVI_DATA.slice(0, visibleBars).map((h, i) => {
                      const belowThreshold = h.ndvi < 0.6
                      return (
                        <motion.div
                          key={h.year}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center gap-3"
                        >
                          <span className="text-[11px] text-muted3 w-10 text-right font-mono">{h.year}</span>
                          <div className="flex-1 h-4 bg-surface2 rounded overflow-hidden relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${h.ndvi * 100}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                              className={`h-full rounded ${belowThreshold ? 'bg-red-400' : 'bg-emerald-500'}`}
                            />
                            {/* Threshold marker */}
                            <div className="absolute top-0 bottom-0 w-[1.5px] bg-red-400/60" style={{ left: '60%' }} />
                          </div>
                          <span className={`text-[11px] font-mono font-semibold w-9 ${belowThreshold ? 'text-red-600' : 'text-emerald-700'}`}>
                            {h.ndvi.toFixed(2)}
                          </span>
                        </motion.div>
                      )
                    })}
                  </div>

                  {visibleBars >= NDVI_DATA.length && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-4 pt-3 border-t border-border"
                    >
                      <div className={`text-[11px] font-medium flex items-center gap-1.5 ${currentNdvi < 0.6 ? 'text-red-600' : 'text-emerald-700'}`}>
                        {currentNdvi < 0.6 ? <AlertTriangle size={13} /> : <FileCheck size={13} />}
                        {currentNdvi < 0.6
                          ? 'NDVI 산림 임계값(0.6) 하회 — 산림전용 의심'
                          : 'NDVI 산림 임계값 이상 유지'}
                      </div>
                      <div className="text-[10px] text-muted3 mt-1">
                        현재: <span className="font-mono font-bold">{currentNdvi.toFixed(2)}</span> · 2020 대비: <span className="font-mono">{((currentNdvi - 0.71) * 100).toFixed(0)}%</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Alerts */}
              {visibleBars >= NDVI_DATA.length && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 space-y-2"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="px-4 py-3 rounded-card text-[12px] border bg-amber-50 border-amber-200"
                  >
                    <div className="font-semibold text-amber-800 flex items-center gap-1.5 mb-0.5">
                      <AlertTriangle size={13} />
                      산림전용 위험 감지
                    </div>
                    <p className="text-amber-700">2020–2024 기간 산림 면적 31%p 감소. EUDR Art.10(1) cutoff date(2020-12-31) 이후 유의미한 산림전용 진행. 현장 검증 및 추가 DDS 보완 권장.</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="px-4 py-3 rounded-card text-[12px] border bg-blue-50 border-blue-200"
                  >
                    <div className="font-semibold text-blue-800 flex items-center gap-1.5 mb-0.5">
                      <MapPin size={13} />
                      공급망 연계 확인
                    </div>
                    <p className="text-blue-700">GPS polygon(DDS p.3)과 위성 분석 지역 일치 확인. ISCC-ID-PKS-2024-0847 인증 범위와 90% 중첩. 나머지 10% 미인증 구역 추가 확인 필요.</p>
                  </motion.div>
                </motion.div>
              )}

              {/* Footer */}
              <div className="mt-4 font-mono text-[10px] text-muted3 flex gap-3">
                <span>2.50°S 111.79°E</span><span>·</span>
                <span>Central Kalimantan, Indonesia</span><span>·</span>
                <span>Sentinel-2 Cloudless · 10m</span><span>·</span>
                <span>U-Net + Grad-CAM + NDVI</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}
