import { useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

function TerrainModel() {
  const { scene } = useGLTF('/terrain.glb')
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      mesh.receiveShadow = true
      mesh.castShadow = true
    }
  })
  return <primitive object={scene} scale={1.5} position={[0, -1, 0]} />
}

function TreesModel() {
  const { scene } = useGLTF('/trees.glb')
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      mesh.castShadow = true
    }
  })
  return <primitive object={scene} scale={1.5} position={[0, -1, 0]} />
}

function CameraRig() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime() * 0.04
    const r = 12
    camera.position.x = Math.sin(t) * r
    camera.position.z = Math.cos(t) * r
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

export default function TerrainView() {
  return (
    <div className="w-full h-full relative">
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
          <TerrainModel />
          <TreesModel />
        </Suspense>
        <ScanLine />
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

useGLTF.preload('/terrain.glb')
useGLTF.preload('/trees.glb')
