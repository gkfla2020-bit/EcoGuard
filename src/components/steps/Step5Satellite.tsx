import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Satellite, Loader2, BarChart3, FileCheck, AlertTriangle, MapPin, Play, Pause } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip, ResponsiveContainer } from 'recharts'

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


export default function Step5Satellite({ skipLoading = false }: { skipLoading?: boolean }) {
  const [appPhase, setAppPhase] = useState<'idle' | 'analyzing' | 'done'>('idle')
  const [analysisProgress, setAnalysisProgress] = useState(0)
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

  const runAnalysis = () => {
    setAppPhase('analyzing')
    setAnalysisProgress(0)
    let p = 0
    const timer = setInterval(() => {
      p += 2 + Math.random() * 4
      if (p >= 100) {
        setAnalysisProgress(100)
        clearInterval(timer)
        setTimeout(() => setAppPhase('done'), 300)
      } else {
        setAnalysisProgress(Math.min(p, 99))
      }
    }, 80)
  }

  return (
    <section>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {appPhase !== 'idle' && (
          <div className="mb-4">
            <h2 className="font-heading text-[22px] font-bold text-ink tracking-tight">위성 환경 검증</h2>
            <p className="text-[13px] text-muted2 mt-1">
              위성 사진으로 원산지의 산림이 실제로 파괴되었는지 AI가 판별합니다.
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {appPhase === 'idle' && (
            <motion.div
              key="idle"
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="border border-border rounded-card bg-white p-5"
            >
              <h2 className="font-heading text-[20px] font-bold text-ink tracking-tight mb-1">위성 환경 검증</h2>
              <p className="text-[12px] text-muted2 mb-4">2020년 이후 산림이 파괴됐는지 위성 AI가 판별합니다. 파괴 시 EU 수출 불가.</p>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={runAnalysis}
                  style={{ backgroundColor: "#0A0A0A", color: "#fff" }} className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Satellite size={15} />
                  CNN 분석 실행
                </button>
                <button
                  onClick={() => { setAppPhase('done'); setVisibleBars(NDVI_DATA.length) }}
                  className="px-4 py-2.5 border border-border rounded-lg text-[12px] text-muted2 hover:bg-surface2 hover:text-ink hover:border-border2 transition-all"
                >
                  결과 바로보기
                </button>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[13px] font-semibold text-ink">위성 데이터 준비됨</div>
                  <div className="text-[11px] text-muted2 mt-0.5">Sentinel-2 L2A · 2019–2024 · Central Kalimantan (2.50°S, 111.79°E)</div>
                </div>
                <div className="font-mono text-[10px] text-muted3">6 tiles · 10m resolution</div>
              </div>
              <div className="grid grid-cols-6 gap-2 mb-5">
                {YEARS.map(yr => (
                  <div key={yr} className="aspect-square rounded-lg overflow-hidden border border-border bg-neutral-100 relative group/thumb hover:border-ink transition-colors">
                    <img src={`/satellite/orig_${yr}.png`} alt={`${yr}`} className="w-full h-full object-cover opacity-60 group-hover/thumb:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                      <span className="bg-black/70 text-white text-[13px] font-mono font-bold px-2.5 py-1 rounded-md">{yr}</span>
                    </div>
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 group-hover/thumb:opacity-0 transition-opacity">
                      <span className="bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">{yr}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {appPhase === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="border border-border rounded-card bg-white p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Loader2 size={16} className="text-ink animate-spin" />
                <span className="text-[13px] font-semibold text-ink">분석 중</span>
                <span className="font-mono text-[11px] text-muted3 ml-auto">{Math.round(analysisProgress)}%</span>
              </div>
              <div className="w-full h-2 bg-surface2 rounded-full overflow-hidden">
                <div className="h-full bg-ink rounded-full transition-all duration-100" style={{ width: `${analysisProgress}%` }} />
              </div>
              <div className="mt-3 font-mono text-[10px] text-muted3">
                {analysisProgress < 30 ? 'U-Net Segmentation 추론...' :
                 analysisProgress < 60 ? 'Grad-CAM saliency map 생성...' :
                 analysisProgress < 85 ? 'NDVI 시계열 계산...' : '결과 렌더링...'}
              </div>
            </motion.div>
          )}

          {appPhase === 'done' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Pipeline steps indicator */}
              <div className="flex items-center gap-0 mb-5 border border-border rounded-lg overflow-hidden bg-white">
                {[
                  { label: 'Sentinel-2 수집', sub: '6 tiles', done: true },
                  { label: 'U-Net Segmentation', sub: 'ResNet34', done: true },
                  { label: 'Grad-CAM', sub: 'Saliency map', done: true },
                  { label: 'NDVI 계산', sub: '(NIR−R)/(NIR+R)', done: true },
                  { label: '판정', sub: risk + ' Risk', done: true },
                ].map((p, i) => (
                  <div key={p.label} className={`flex-1 flex items-center gap-2 px-3 py-2.5 ${i < 4 ? 'border-r border-border' : ''} ${i === 4 ? (risk === 'High' ? 'bg-red-50' : risk === 'Medium' ? 'bg-amber-50' : 'bg-emerald-50') : ''}`}>
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      <span className="text-white text-[8px] font-bold">✓</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-medium text-ink truncate">{p.label}</div>
                      <div className="text-[9px] text-muted3 font-mono">{p.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Controls bar */}
              <div className="flex items-center gap-3 mb-4">
                {/* Year selector */}
                <div className="flex gap-1.5">
                  {YEARS.map(yr => {
                    const active = year === yr
                    const yrRisk = STATS[yr].forest < 50 ? 'high' : STATS[yr].forest < 65 ? 'mid' : 'low'
                    return (
                      <button key={yr} onClick={() => { setYear(yr); setPlaying(false) }}
                        title={`${yr}년 위성 데이터 · 산림 ${STATS[yr].forest}%`}
                        className={`relative px-3.5 py-2 rounded-lg font-mono text-[12px] font-semibold transition-all active:scale-[0.98] ${
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all active:scale-[0.98] ${
                    playing ? 'bg-red-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {playing ? <><Pause size={13} /> 정지</> : <><Play size={13} /> 타임라인 재생</>}
                </button>

                {/* View toggle */}
                <div className="ml-auto flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-surface2 rounded-lg p-1">
                    {(['seg', 'cam'] as const).map(v => (
                      <button key={v} onClick={() => setView(v)}
                        className={`px-3.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                          view === v ? 'bg-white text-ink shadow-sm' : 'text-muted2 hover:text-ink'
                        }`}>
                        {v === 'seg' ? 'Segmentation' : 'Grad-CAM'}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => { setAppPhase('idle'); setVisibleBars(0) }}
                    className="px-3 py-1.5 rounded-md border border-border text-[10px] font-medium text-muted2 hover:bg-surface2 hover:text-ink transition-colors"
                    title="분석 다시 실행"
                  >
                    재분석
                  </button>
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
                  <div className="relative border-r border-border bg-neutral-900 overflow-hidden group/img">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={`orig-${year}`}
                        src={`/satellite/orig_${year}.png`}
                        alt={`Satellite ${year}`}
                        className="w-full h-full object-cover transition-[filter] duration-300 group-hover/img:brightness-110"
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
                  <div className="relative bg-neutral-900 overflow-hidden group/img2">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={`result-${year}-${view}`}
                        src={view === 'seg' ? `/satellite/seg_${year}.png` : `/satellite/overlay_${year}.png`}
                        alt={`${view} ${year}`}
                        className="w-full h-full object-cover transition-[filter] duration-300 group-hover/img2:brightness-110"
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
                  {(() => {
                    const prevYear = YEARS[YEARS.indexOf(year as any) - 1]
                    const prev = prevYear ? STATS[prevYear] : null
                    const fd = prev ? s.forest - prev.forest : 0
                    return [
                      { l: 'Forest', v: `${s.forest}%`, d: fd, c: s.forest < 50 ? 'text-red-600' : 'text-emerald-700' },
                      { l: 'Farmland', v: `${s.farm}%`, d: prev ? s.farm - prev.farm : 0, c: 'text-amber-600' },
                      { l: 'Bare', v: `${s.bare}%`, d: prev ? s.bare - prev.bare : 0, c: s.bare > 10 ? 'text-red-600' : 'text-muted2' },
                      { l: 'Urban', v: `${s.urban}%`, d: prev ? s.urban - prev.urban : 0, c: 'text-muted2' },
                      { l: 'Δ vs 2019', v: `${change > 0 ? '+' : ''}${change}%p`, d: 0, c: change < -10 ? 'text-red-600' : 'text-emerald-700' },
                    ]
                  })().map(k => (
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
                      {k.d !== 0 && (
                        <div className={`font-mono text-[9px] mt-0.5 ${k.d < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                          {k.d > 0 ? '+' : ''}{k.d}%p vs prev
                        </div>
                      )}
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
                      <div className="text-[11px] text-muted2 mt-0.5"><span title="NDVI: 식물의 활력을 0~1로 나타낸 지수. 0.6 이상이면 건강한 산림." className="underline decoration-dotted cursor-help">NDVI</span> · 2019–2024</div>
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
                      <Tooltip contentStyle={{ fontSize: 12, fontFamily: 'JetBrains Mono', borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={(value) => [Number(value).toFixed(3), 'NDVI']} cursor={{ stroke: '#d4d4d8', strokeWidth: 1, strokeDasharray: '4 4' }} />
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

              {/* Analysis notes — inline, not alert boxes */}
              {visibleBars >= NDVI_DATA.length && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 border border-border rounded-card bg-white p-4"
                >
                  <div className="text-[12px] font-semibold text-ink mb-2">분석 소견</div>
                  <div className="space-y-1.5 text-[11px] text-muted2">
                    <div className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">●</span>
                      <span>2020–2024 산림 면적 31%p 감소 (78% → 47%). EUDR cutoff(2020-12-31) 이후 유의미한 변화 감지.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted3 mt-0.5">●</span>
                      <span>GPS polygon(DDS p.3) — 위성 분석 영역 90% 중첩 확인. 미인증 구역 10% 존재.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted3 mt-0.5">●</span>
                      <span>NDVI 2020: 0.71 → 2024: 0.50 (Δ-29.6%). 산림 임계값(0.6) 하회 시점: 2023.</span>
                    </div>
                  </div>
                  {/* 비즈니스 임팩트 */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-[11px] font-semibold text-red-700 mb-1">비즈니스 영향</div>
                    <p className="text-[11px] text-muted2 leading-relaxed">
                      이 상태로 EU에 수출하면 EUDR Art.3 위반으로 <span className="font-semibold text-ink">통관 거부 + 매출액 4% 과징금</span> 가능.
                      추가 DDS 보완 또는 대체 공급원 확보를 권장합니다.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* 최종 CTA */}
              {visibleBars >= NDVI_DATA.length && (
                <div className="mt-5 bg-ink rounded-card p-5 flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-semibold text-white">모든 검증 완료</div>
                    <div className="text-[11px] text-white/60 mt-0.5">5단계 파이프라인 결과를 기반으로 DDS 리포트를 생성할 수 있습니다.</div>
                  </div>
                  <button
                    onClick={() => {
                      const report = `EUDR Due Diligence Statement (DDS) Report
Generated: ${new Date().toISOString().slice(0,10)}
Case ID: ECO-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-001

1. OPERATOR INFORMATION
   Importer: UniHana Trading GmbH (EU)
   Exporter: PT. Sawit Kalimantan Utama (Indonesia)

2. PRODUCT INFORMATION
   Product: Crude Palm Oil (CPO)
   HS Code: 1511.10.00
   Quantity: 2,400 MT
   Origin: Central Kalimantan, Indonesia (2.50S, 111.79E)
   Certification: ISCC EU Plus (exp. 2025-12)

3. GEOLOCATION DATA
   GPS Polygon: 4.2 ha coverage
   Coordinates: 2.50S, 111.79E
   Sentinel-2 L2A imagery: 2019-2024

4. RISK ASSESSMENT
   Forest Cover (2019): 78%
   Forest Cover (2024): 47%
   Change: -31%p (HIGH RISK)
   NDVI (2020): 0.71 → (2024): 0.50
   EUDR Cutoff Date: 2020-12-31
   Verdict: Significant deforestation detected post-cutoff

5. CBAM DECLARATION
   Emission Factor: 3.2 tCO2/t (actual measurement)
   EU Default: 4.5 tCO2/t
   Annual Savings: ~7.3B KRW (2034 basis)
   Quality Score: 85/100

6. COMPLIANCE STATUS
   EUDR Art.3 (Deforestation): WARNING - Further verification needed
   EUDR Art.4 (DDS): PASS
   EUDR Art.9 (Geolocation): PASS
   EUDR Art.10 (Cutoff): WARNING
   EUDR Art.12 (Legality): PASS
   CBAM Art.35: PASS
   CSDDD Art.7-8: PASS

7. RECOMMENDATION
   Additional field verification recommended.
   Alternative supply source evaluation advised.

---
EcoTrade Compliance Platform v2.0
Team UniHana`
                      const blob = new Blob([report], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `DDS_Report_${new Date().toISOString().slice(0,10)}.txt`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="px-5 py-2.5 bg-white text-ink rounded-lg text-[12px] font-semibold hover:bg-white/90 transition-colors active:scale-[0.98]"
                  >
                    DDS 리포트 생성
                  </button>
                </div>
              )}

              {/* Footer */}
              <div className="mt-4 font-mono text-[10px] text-muted3 flex items-center gap-3">
                <span>2.50°S 111.79°E</span><span>·</span>
                <span>Central Kalimantan, Indonesia</span><span>·</span>
                <span>Sentinel-2 L2A · 10m</span><span>·</span>
                <span>U-Net + Grad-CAM</span>
                <span className="ml-auto flex items-center gap-2">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Analyzed just now</span>
                  <button className="px-2 py-0.5 rounded border border-border text-[9px] font-medium text-muted2 hover:bg-surface2 hover:text-ink transition-colors">PDF Report</button>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}
