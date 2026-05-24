import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

function Terrain() {
  const texture = useTexture('/satellite/orig_2020.png')
  const meshRef = useRef<THREE.Mesh>(null)

  texture.wrapS = texture.wrapT = THREE.RepeatWrapping

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[20, 20, 64, 64]} />
      <meshStandardMaterial map={texture} displacementScale={0.3} />
    </mesh>
  )
}

function CameraRig() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime() * 0.12
    camera.position.x = Math.sin(t) * 4
    camera.position.z = Math.cos(t) * 4
    camera.position.y = 3.5 + Math.sin(t * 0.4) * 0.5
    camera.lookAt(0, 0, 0)
  })
  return null
}

function FloatingParticles() {
  const ref = useRef<THREE.Points>(null)
  const count = 200
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = Math.random() * 5 + 1
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20
  }

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.getElapsedTime() * 0.02
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#ffffff" transparent opacity={0.4} />
    </points>
  )
}

export default function TerrainView() {
  return (
    <div className="w-full h-full bg-neutral-900 rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [0, 5, 6], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: '#0a0a0a' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <fog attach="fog" args={['#0a0a0a', 8, 18]} />
        <Terrain />
        <FloatingParticles />
        <CameraRig />
      </Canvas>
    </div>
  )
}
