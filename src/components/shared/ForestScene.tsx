import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function Model() {
  const { scene } = useGLTF('/forest_path.glb')
  return <primitive object={scene} scale={1} position={[0, 0, 0]} />
}

function CameraRig() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime() * 0.03
    const r = 15
    camera.position.x = Math.sin(t) * r
    camera.position.z = Math.cos(t) * r
    camera.position.y = 8 + Math.sin(t * 0.2) * 2
    camera.lookAt(0, 0, 0)
  })
  return null
}

export default function ForestScene() {
  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [15, 8, 15], fov: 45 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.0
        }}
        style={{ background: '#0a0f0a' }}
      >
        <fog attach="fog" args={['#0a0f0a', 15, 40]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 15, 5]} intensity={1.5} color="#ffeedd" />
        <directionalLight position={[-5, 5, -8]} intensity={0.3} color="#88aaff" />
        <Suspense fallback={null}>
          <Model />
        </Suspense>
        <CameraRig />
      </Canvas>
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

useGLTF.preload('/forest_path.glb')
