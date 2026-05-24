export default function TerrainView() {
  return (
    <div className="w-full h-full bg-[#0a0a0a] overflow-hidden relative">
      {/* Perspective container — tilted satellite image drifting */}
      <div className="absolute inset-0" style={{ perspective: '800px' }}>
        <div
          className="absolute inset-[-40%] animate-drift"
          style={{ transform: 'rotateX(55deg) rotateZ(-10deg)', transformOrigin: 'center center' }}
        >
          <img
            src="/satellite/forest_aerial.jpg"
            alt=""
            className="w-full h-full object-cover opacity-80"
            style={{ filter: 'saturate(1.3) contrast(1.15) brightness(0.9)' }}
          />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>
      </div>

      {/* Scan line */}
      <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-scan" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#0a0a0a_80%)]" />

      {/* Corner data overlay */}
      <div className="absolute top-4 left-4 font-mono text-[9px] text-white/30 space-y-1">
        <div>LAT -2.50 LON 111.79</div>
        <div>ALT 420m AGL</div>
        <div>RES 10m/px</div>
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-white/30">
        Sentinel-2 L2A
      </div>
    </div>
  )
}
