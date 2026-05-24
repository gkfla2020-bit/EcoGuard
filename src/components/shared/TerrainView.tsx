import { useRef, Suspense, Component, ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() { return this.state.hasError ? this.props.fallback : this.props.children }
}

function Scene() {
  const terrain = useGLTF('/terrain.glb')
  const trees = useGLTF('/trees.glb')

  terrain.scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      (child as THREE.Mesh).receiveShadow = true
    }
  })
  trees.scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      (child as THREE.Mesh).castShadow = true
    }
  })

  return (
    <>
      <primitive object={terrain.scene} scale={1.5} position={[0, -1, 0]} />
      <primitive object={trees.scene} scale={1.5} position={[0, -1, 0]} />
    </>
  )
}

function CameraRig() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime() * 0.04
    camera.position.x = Math.sin(t) * 12
    camera.position.z = Math.cos(t) * 12
    camera.position.y = 6 + Math.sin(t * 0.3) * 1
    camera.lookAt(0, 0, 0)
  })
  return null
}

function ScanLine() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.z = Math.sin(clock.getElapsedTime() * 0.2) * 8
  })
  return (
    <mesh ref={ref} position={[0, 4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[25, 0.04]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.25} />
    </mesh>
  )
}

function CSSFallback() {
  return (
    <div className="w-full h-full bg-[#0a0a0a] overflow-hidden relative">
      <div className="absolute inset-0" style={{ perspective: '800px' }}>
        <div className="absolute inset-[-40%] animate-drift" style={{ transform: 'rotateX(55deg) rotateZ(-10deg)' }}>
          <img src="/satellite/forest_aerial.jpg" alt="" className="w-full h-full object-cover opacity-80" style={{ filter: 'saturate(1.3) contrast(1.1)' }} />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>
      </div>
      <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-scan" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#0a0a0a_80%)]" />
      <div className="absolute top-4 left-4 font-mono text-[9px] text-white/25 space-y-0.5">
        <div>2.50S 111.79E</div>
        <div>ALT 420m</div>
      </div>
    </div>
  )
}

export default function TerrainView() {
  return (
    <div className="w-full h-full relative">
      <ErrorBoundary fallback={<CSSFallback />}>
        <Canvas
          shadows
          camera={{ position: [12, 6, 12], fov: 40 }}
          gl={{ antialias: true }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 0.8
          }}
          style={{ background: '#070a07' }}
        >
          <fog attach="fog" args={['#070a07', 10, 25]} />
          <ambientLight intensity={0.3} />
          <directionalLight position={[8, 12, 4]} intensity={2} color="#ffeedd" castShadow shadow-mapSize={512} />
          <directionalLight position={[-5, 3, -6]} intensity={0.3} color="#88aaff" />
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
          <ScanLine />
          <CameraRig />
        </Canvas>
      </ErrorBoundary>
      <div className="absolute top-4 left-4 font-mono text-[9px] text-white/25 space-y-0.5">
        <div>2.50S 111.79E</div>
        <div>ALT 420m AGL</div>
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-white/25">
        Terrain Scan
      </div>
    </div>
  )
}

useGLTF.preload('/terrain.glb')
useGLTF.preload('/trees.glb')
