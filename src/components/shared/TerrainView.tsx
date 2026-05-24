import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Terrain() {
  const mesh = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(30, 30, 60, 60)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const height =
        Math.sin(x * 0.3) * Math.cos(y * 0.3) * 1.5 +
        Math.sin(x * 0.7 + 2) * Math.cos(y * 0.5 + 1) * 0.6 +
        Math.sin(x * 1.5 + 5) * Math.cos(y * 1.2 + 3) * 0.2
      pos.setZ(i, height)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <mesh ref={mesh} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial color="#1a5c1a" roughness={0.9} flatShading />
    </mesh>
  )
}

function Trees() {
  const trees = useMemo(() => {
    const arr = []
    for (let i = 0; i < 80; i++) {
      const x = (Math.random() - 0.5) * 24
      const z = (Math.random() - 0.5) * 24
      const h =
        Math.sin(x * 0.3) * Math.cos(z * 0.3) * 1.5 +
        Math.sin(x * 0.7 + 2) * Math.cos(z * 0.5 + 1) * 0.6
      const scale = 0.3 + Math.random() * 0.5
      arr.push({ x, z, y: h, scale })
    }
    return arr
  }, [])

  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, t.y, t.z]} scale={t.scale}>
          {/* Trunk */}
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.08, 0.8, 5]} />
            <meshStandardMaterial color="#4a3520" roughness={1} />
          </mesh>
          {/* Canopy */}
          <mesh position={[0, 1.0, 0]} castShadow>
            <coneGeometry args={[0.4, 1.2, 6]} />
            <meshStandardMaterial color={`hsl(${130 + Math.random() * 30}, 60%, ${20 + Math.random() * 15}%)`} roughness={0.8} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function CameraRig() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime() * 0.05
    camera.position.x = Math.sin(t) * 10
    camera.position.z = Math.cos(t) * 10
    camera.position.y = 5 + Math.sin(t * 0.3) * 1
    camera.lookAt(Math.sin(t + 0.5) * 2, 0, Math.cos(t + 0.5) * 2)
  })
  return null
}

function ScanPlane() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.z = Math.sin(clock.getElapsedTime() * 0.2) * 10
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 3, 0]}>
      <planeGeometry args={[30, 0.05]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.3} />
    </mesh>
  )
}

export default function TerrainView() {
  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ position: [10, 5, 10], fov: 45 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 0.7
        }}
        style={{ background: '#080c08' }}
      >
        <fog attach="fog" args={['#080c08', 8, 22]} />
        <ambientLight intensity={0.25} />
        <directionalLight position={[8, 12, 4]} intensity={2} color="#ffeedd" castShadow shadow-mapSize={512} />
        <directionalLight position={[-4, 4, -8]} intensity={0.3} color="#88aaff" />
        <Terrain />
        <Trees />
        <ScanPlane />
        <CameraRig />
      </Canvas>
      {/* HUD overlay */}
      <div className="absolute top-4 left-4 font-mono text-[9px] text-white/30 space-y-0.5">
        <div>2.50S 111.79E</div>
        <div>ALT 320m</div>
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-white/30">
        LiDAR Scan Active
      </div>
    </div>
  )
}
