import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle2, X, AlertCircle, Shield } from 'lucide-react'
import PhaseLoader from '../shared/PhaseLoader'
import type { Phase } from '../shared/PhaseLoader'

type FileSlot = {
  id: string
  label: string
  required: boolean
  accept: string
  file: File | null
  status: 'empty' | 'uploaded' | 'validating' | 'valid' | 'error'
}

const INITIAL_SLOTS: FileSlot[] = [
  { id: 'invoice', label: '상업 송장 (Invoice)', required: true, accept: '.pdf,.png,.jpg', file: null, status: 'empty' },
  { id: 'bol', label: '선하증권 (Bill of Lading)', required: true, accept: '.pdf', file: null, status: 'empty' },
  { id: 'origin', label: '원산지 증명서', required: true, accept: '.pdf,.png', file: null, status: 'empty' },
  { id: 'phyto', label: '식물검역 인증서', required: true, accept: '.pdf', file: null, status: 'empty' },
  { id: 'dds', label: '자체 실사 보고서 (DDS)', required: true, accept: '.pdf', file: null, status: 'empty' },
  { id: 'gps', label: 'GPS Polygon (GeoJSON)', required: false, accept: '.geojson,.json,.kml', file: null, status: 'empty' },
]

const VALIDATION_PHASES: Phase[] = [
  { id: 'scan', label: '파일 무결성 검사 중...', icon: Shield, duration: 800 },
  { id: 'format', label: '포맷 적합성 확인...', icon: FileText, duration: 1000 },
  { id: 'meta', label: '메타데이터 추출 중...', icon: AlertCircle, duration: 1200 },
  { id: 'check', label: 'EUDR 요건 대조 중...', icon: CheckCircle2, duration: 900 },
]

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Step1Intake() {
  const [slots, setSlots] = useState<FileSlot[]>(INITIAL_SLOTS)
  const [phase, setPhase] = useState<'upload' | 'validating' | 'done'>('upload')
  const [dragTarget, setDragTarget] = useState<string | null>(null)

  const uploadedCount = slots.filter(s => s.file !== null).length
  const requiredCount = slots.filter(s => s.required).length
  const requiredUploaded = slots.filter(s => s.required && s.file !== null).length
  const allRequiredDone = requiredUploaded === requiredCount

  const handleFile = useCallback((slotId: string, file: File) => {
    setSlots(prev => prev.map(s =>
      s.id === slotId ? { ...s, file, status: 'uploaded' } : s
    ))
  }, [])

  const removeFile = (slotId: string) => {
    setSlots(prev => prev.map(s =>
      s.id === slotId ? { ...s, file: null, status: 'empty' } : s
    ))
  }

  const handleDrop = (slotId: string, e: React.DragEvent) => {
    e.preventDefault()
    setDragTarget(null)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(slotId, file)
  }

  const handleBulkDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragTarget(null)
    const files = Array.from(e.dataTransfer.files)
    const emptySlots = slots.filter(s => !s.file)
    files.forEach((file, i) => {
      if (i < emptySlots.length) {
        handleFile(emptySlots[i].id, file)
      }
    })
  }

  const loadDemoFiles = () => {
    const demoFiles = [
      { id: 'invoice', name: 'Invoice_PalmOil_2024.pdf', size: 2457600 },
      { id: 'bol', name: 'BoL_KalimantanPort.pdf', size: 1126400 },
      { id: 'origin', name: 'OriginCert_ISCC_EU.pdf', size: 1843200 },
      { id: 'phyto', name: 'PhytoSanitaryCert_ID.pdf', size: 911360 },
      { id: 'dds', name: 'DDS_SelfDeclaration.pdf', size: 3276800 },
      { id: 'gps', name: 'polygon_kalimantan.geojson', size: 45056 },
    ]
    setSlots(prev => prev.map(s => {
      const demo = demoFiles.find(d => d.id === s.id)
      if (!demo) return s
      const file = new File([''], demo.name, { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: demo.size })
      return { ...s, file, status: 'uploaded' }
    }))
  }

  const startValidation = () => {
    setPhase('validating')
  }

  const onValidationComplete = () => {
    setSlots(prev => prev.map(s => s.file ? { ...s, status: 'valid' } : s))
    setPhase('done')
  }

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <h2 className="font-heading text-[22px] font-bold text-ink tracking-tight">서류 접수</h2>
          <p className="text-[13px] text-muted2 mt-1">
            수입 건에 필요한 서류를 업로드합니다. EUDR Art.4 DDS 요건 충족을 위해 최소 {requiredCount}종의 필수 문서가 필요합니다.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {phase === 'upload' && (
            <motion.div key="upload" exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Bulk drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragTarget('bulk') }}
                onDragLeave={() => setDragTarget(null)}
                onDrop={handleBulkDrop}
                className={`border-2 border-dashed rounded-card p-6 text-center transition-all mb-5 ${
                  dragTarget === 'bulk' ? 'border-emerald-400 bg-emerald-50 scale-[1.01]' : 'border-border bg-surface'
                }`}
              >
                <Upload size={28} className="mx-auto text-muted3 mb-2" />
                <p className="text-[13px] font-medium text-ink">여러 파일을 한번에 드래그하여 일괄 업로드</p>
                <p className="text-[11px] text-muted3 mt-1">PDF, PNG, JPG, GeoJSON · 파일당 최대 50MB</p>
              </div>

              {/* Per-slot upload */}
              <div className="space-y-2">
                {slots.map((slot, i) => (
                  <motion.div
                    key={slot.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    onDragOver={e => { e.preventDefault(); setDragTarget(slot.id) }}
                    onDragLeave={() => setDragTarget(null)}
                    onDrop={e => handleDrop(slot.id, e)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg border transition-all ${
                      dragTarget === slot.id ? 'border-emerald-400 bg-emerald-50' :
                      slot.file ? 'border-emerald-200 bg-emerald-50/30' :
                      'border-border bg-white hover:border-border2'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      slot.file ? 'bg-emerald-100' : 'bg-surface2'
                    }`}>
                      {slot.file ? <CheckCircle2 size={18} className="text-emerald-600" /> : <FileText size={18} className="text-muted3" />}
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-ink">{slot.label}</span>
                        {slot.required && <span className="text-[9px] font-semibold text-red-500 uppercase">필수</span>}
                      </div>
                      {slot.file ? (
                        <div className="text-[11px] text-muted2 mt-0.5 truncate">
                          {slot.file.name} · {formatSize(slot.file.size)}
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted3 mt-0.5">파일을 드래그하거나 클릭하여 첨부</div>
                      )}
                    </div>

                    {/* Action */}
                    {slot.file ? (
                      <button onClick={() => removeFile(slot.id)} className="p-1.5 rounded-md hover:bg-red-50 text-muted3 hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    ) : (
                      <label className="px-3 py-1.5 rounded-md bg-surface2 text-[11px] font-medium text-muted2 hover:bg-border hover:text-ink cursor-pointer transition-colors active:scale-[0.97]">
                        선택
                        <input type="file" accept={slot.accept} className="hidden" onChange={e => {
                          const f = e.target.files?.[0]
                          if (f) handleFile(slot.id, f)
                        }} />
                      </label>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Status + Submit */}
              <div className="mt-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-[12px] text-muted2">
                    <span className="font-mono font-semibold text-ink">{uploadedCount}</span> / {slots.length} 파일 업로드됨
                    {allRequiredDone && <span className="ml-2 text-emerald-600 font-medium">· 필수 서류 완비</span>}
                  </div>
                  {uploadedCount === 0 && (
                    <button onClick={loadDemoFiles} className="px-3 py-1.5 rounded-md border border-border text-[11px] font-medium text-muted2 hover:bg-surface2 transition-colors active:scale-[0.97]">
                      데모 파일 로드
                    </button>
                  )}
                </div>
                <button
                  onClick={startValidation}
                  disabled={!allRequiredDone}
                  className={`px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all active:scale-[0.97] ${
                    allRequiredDone
                      ? 'bg-ink text-white hover:bg-ink2 shadow-sm'
                      : 'bg-surface2 text-muted3 cursor-not-allowed'
                  }`}
                >
                  서류 검증 시작
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'validating' && (
            <motion.div
              key="validating"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="border border-border rounded-card p-6 bg-white"
            >
              <div className="text-[13px] font-semibold text-ink mb-4">서류 검증 진행 중</div>
              <PhaseLoader phases={VALIDATION_PHASES} onComplete={onValidationComplete} />
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Success banner */}
              <div className="border-2 border-emerald-300 rounded-card p-4 bg-emerald-50 flex items-center gap-3 mb-5">
                <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
                <div>
                  <div className="text-[13px] font-semibold text-emerald-800">서류 검증 완료 · 자동 인식 성공</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">기업/품목 자동 분류 완료. 해당 업종 규제 요건이 적용됩니다.</div>
                </div>
              </div>

              {/* Auto-recognized entity info */}
              <div className="border border-border rounded-card bg-white p-5 mb-4">
                <div className="text-[12px] font-semibold text-ink mb-3">자동 인식 결과</div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {[
                    { label: '수출기업', value: 'PT. Sawit Kalimantan Utama' },
                    { label: '수입기업', value: 'UniHana Trading GmbH (EU)' },
                    { label: 'HS 코드', value: '1511.10.00 — Crude Palm Oil' },
                    { label: '업종 분류', value: 'Agriculture > Vegetable Oils > Palm Oil' },
                    { label: '원산지', value: 'Indonesia (Central Kalimantan)' },
                    { label: '수량', value: '2,400 MT (해상 운송)' },
                    { label: '인증', value: 'ISCC EU Plus (유효: 2025-12)' },
                    { label: '적용 규제', value: 'EUDR (산림전용) + CBAM (탄소) + CSDDD' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-baseline gap-2"
                    >
                      <span className="text-[11px] text-muted3 w-[72px] shrink-0">{item.label}</span>
                      <span className="text-[12px] font-medium text-ink">{item.value}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Sector-specific requirements */}
              <div className="border border-border rounded-card bg-white p-5 mb-4">
                <div className="text-[12px] font-semibold text-ink mb-3">Palm Oil 업종 규제 요건 (HS 1511)</div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { reg: 'EUDR', items: ['GPS polygon (생산지)', 'DDS 실사보고서', '산림전용 무 증명', '합법성 서류'], color: 'amber' },
                    { reg: 'CBAM', items: ['배출계수 (tCO₂/t)', 'Scope 1+2 보고서', 'LCA 데이터', '에너지 사용량'], color: 'blue' },
                    { reg: 'CSDDD', items: ['공급망 인권 실사', '소규모 농가 목록', 'ILO 준수 선언', '환경복원 계획'], color: 'purple' },
                  ].map(r => (
                    <div key={r.reg} className={`rounded-lg border p-3 ${
                      r.color === 'amber' ? 'border-amber-200 bg-amber-50/50' :
                      r.color === 'blue' ? 'border-blue-200 bg-blue-50/50' :
                      'border-purple-200 bg-purple-50/50'
                    }`}>
                      <div className={`text-[11px] font-bold mb-2 ${
                        r.color === 'amber' ? 'text-amber-700' : r.color === 'blue' ? 'text-blue-700' : 'text-purple-700'
                      }`}>{r.reg}</div>
                      {r.items.map(item => (
                        <div key={item} className="flex items-center gap-1.5 text-[10px] text-muted2 mb-1">
                          <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Validated file list */}
              <div className="border border-border rounded-card overflow-hidden bg-white">
                <div className="px-5 py-3 border-b border-border bg-surface">
                  <span className="text-[12px] font-semibold text-ink">검증된 서류 ({uploadedCount}건)</span>
                </div>
                <div className="divide-y divide-border">
                  {slots.filter(s => s.file).map((slot, i) => (
                    <motion.div
                      key={slot.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.08 }}
                      className="px-5 py-3 flex items-center gap-4"
                    >
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-ink truncate">{slot.file!.name}</div>
                        <div className="text-[11px] text-muted3 mt-0.5">{slot.label} · {formatSize(slot.file!.size)}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-semibold">VALID</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer meta */}
        <div className="mt-4 font-mono text-[10px] text-muted3 flex gap-3">
          <span>접수번호: ECO-2026-0523-001</span><span>·</span>
          <span>접수일: 2026-05-23</span><span>·</span>
          <span>EUDR Reg. 2023/1115 Art.4</span>
        </div>
      </motion.div>
    </section>
  )
}
