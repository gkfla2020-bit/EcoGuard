import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

function Terrain() {
  const texture = useTexture('/satellite/orig_2020.png')
  const meshRef = useRef<THREE.Mesh>(null)

  // Use the satellite image itself as displacement (darker = lower, brighter = higher)
  const displacementMap = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.src = '/satellite/orig_2020.png'
    // Create a grayscale displacement from the texture
    ctx.fillStyle = '#444'
    ctx.fillRect(0, 0, 256, 256)
    // Add some noise for terrain variation
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 256
      const y = Math.random() * 256
      const r = Math.random() * 8 + 2
      const v = Math.floor(Math.random() * 100 + 50)
      ctx.fillStyle = `rgb(${v},${v},${v})`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])

  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
  texture.colorSpace = THREE.SRGBColorSpace

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[16, 16, 128, 128]} />
      <meshStandardMaterial
        map={texture}
        displacementMap={displacementMap}
        displacementScale={1.2}
        roughness={0.9}
        metalness={0.0}
      />
    </mesh>
  )
}

function ScanLine() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    // Scan line moves across terrain
    ref.current.position.z = Math.sin(t * 0.3) * 6
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(t * 2) * 0.05
  })

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
      <planeGeometry args={[16, 0.08]} />
      <meshBasicMaterial color="#10b981" transparent opacity={0.2} />
    </mesh>
  )
}

function GridOverlay() {
  const ref = useRef<THREE.LineSegments>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions: number[] = []
    const size = 16
    const divisions = 16
    const step = size / divisions
    const half = size / 2

    for (let i = 0; i <= divisions; i++) {
      const pos = -half + i * step
      positions.push(pos, 0.3, -half, pos, 0.3, half)
      positions.push(-half, 0.3, pos, half, 0.3, pos)
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    ;(ref.current.material as THREE.LineBasicMaterial).opacity = 0.06 + Math.sin(clock.getElapsedTime() * 0.5) * 0.02
  })

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.08} />
    </lineSegments>
  )
}

function CameraRig() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime()
    // Cinematic drone path: slow orbit + slight altitude change
    const radius = 5 + Math.sin(t * 0.1) * 1.5
    const speed = 0.08
    camera.position.x = Math.sin(t * speed) * radius
    camera.position.z = Math.cos(t * speed) * radius
    camera.position.y = 3 + Math.sin(t * 0.15) * 0.8
    // Look slightly ahead of center for motion feel
    const lookX = Math.sin(t * speed + 0.3) * 2
    const lookZ = Math.cos(t * speed + 0.3) * 2
    camera.lookAt(lookX, 0, lookZ)
  })
  return null
}

function DataPoints() {
  const ref = useRef<THREE.Group>(null)
  const points = useMemo(() => {
    return Array.from({ length: 8 }, () => ({
      x: (Math.random() - 0.5) * 12,
      z: (Math.random() - 0.5) * 12,
      scale: 0.03 + Math.random() * 0.04,
    }))
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh
      mesh.position.y = 0.8 + Math.sin(clock.getElapsedTime() * 0.8 + i) * 0.2
    })
  })

  return (
    <group ref={ref}>
      {points.map((p, i) => (
        <mesh key={i} position={[p.x, 0.8, p.z]}>
          <sphereGeometry args={[p.scale, 8, 8]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  )
}

export default function TerrainView() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 4, 6], fov: 50, near: 0.1, far: 50 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 0.8 }}
        style={{ background: '#080808' }}
      >
        <fog attach="fog" args={['#080808', 6, 16]} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 8, 3]} intensity={1.5} color="#fff5e0" />
        <directionalLight position={[-3, 4, -5]} intensity={0.3} color="#b0c4ff" />
        <Suspense fallback={null}>
          <Terrain />
        </Suspense>
        <GridOverlay />
        <ScanLine />
        <DataPoints />
        <CameraRig />
      </Canvas>
    </div>
  )
}
