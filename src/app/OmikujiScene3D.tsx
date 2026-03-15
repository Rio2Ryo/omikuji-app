'use client'

import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'

// ── 六角柱のジオメトリを手動生成 ──────────────────
function createHexPrismGeometry(radius: number, height: number): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radius, radius, height, 6, 1)
  return geo
}

// ── みくじ棒 ──────────────────────────────────────
function MikujiBo({
  index,
  shaking,
  visible,
  stickNumber,
}: {
  index: number
  shaking: boolean
  visible: boolean
  stickNumber: number
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const phase = useMemo(() => Math.random() * Math.PI * 2, [])
  const speed = useMemo(() => 0.8 + Math.random() * 0.6, [])
  const offsetX = useMemo(() => (index - 2) * 0.045, [index])

  useFrame((state) => {
    if (!meshRef.current) return
    if (shaking) {
      const t = state.clock.elapsedTime
      meshRef.current.position.y = 0.5 + Math.abs(Math.sin(t * speed * 6 + phase)) * 0.18
      meshRef.current.rotation.z = Math.sin(t * speed * 4 + phase) * 0.12
    } else {
      meshRef.current.position.y = 0.5
      meshRef.current.rotation.z = 0
    }
  })

  if (!visible) return null

  return (
    <mesh ref={meshRef} position={[offsetX, 0.5, 0]}>
      <cylinderGeometry args={[0.018, 0.018, 1.2, 8]} />
      <meshStandardMaterial
        color="#e8d87a"
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  )
}

// ── 棒が滑り出るアニメーション ────────────────────
function EjectingStick({ stickNumber }: { stickNumber: number }) {
  const groupRef = useRef<THREE.Group>(null!)
  const startTime = useRef<number | null>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    if (startTime.current === null) startTime.current = state.clock.elapsedTime
    const elapsed = state.clock.elapsedTime - startTime.current
    // 0〜2秒でスライドアウト
    const t = Math.min(elapsed / 2.0, 1)
    const ease = 1 - Math.pow(1 - t, 3) // ease out cubic
    groupRef.current.position.y = 0.5 + ease * 1.1
    groupRef.current.rotation.z = -0.18 * (1 - t * 0.3)
  })

  return (
    <group ref={groupRef} position={[0.08, 0.5, 0]} rotation={[0, 0, -0.18]}>
      {/* 棒本体 */}
      <mesh>
        <cylinderGeometry args={[0.020, 0.020, 1.4, 8]} />
        <meshStandardMaterial color="#ecdfa0" roughness={0.35} metalness={0.08} />
      </mesh>
      {/* 光沢ライン */}
      <mesh position={[-0.008, 0, 0.018]}>
        <cylinderGeometry args={[0.004, 0.004, 1.4, 6]} />
        <meshStandardMaterial color="#fffce8" roughness={0.1} metalness={0.0} transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

// ── おみくじ筒 3D本体 ────────────────────────────
function OmikujiTube({
  shaking,
  tilting,
  stickNumber,
  onTiltDone,
}: {
  shaking: boolean
  tilting: boolean
  stickNumber: number
  onTiltDone?: () => void
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const velRef = useRef({ rot: 0, pos: 0 })
  const tiltStartRef = useRef<number | null>(null)
  const tiltDoneRef = useRef(false)

  const hexGeo = useMemo(() => createHexPrismGeometry(0.55, 2.2), [])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    if (shaking) {
      // 弧を描くゆったりした揺れ（スプリング風）
      const target = Math.sin(t * 3.8) * 0.22 + Math.sin(t * 5.1) * 0.08
      const liftY = Math.abs(Math.sin(t * 3.8)) * 0.12
      groupRef.current.rotation.z += (target - groupRef.current.rotation.z) * 0.12
      groupRef.current.position.y += (liftY - groupRef.current.position.y) * 0.10
    } else if (tilting) {
      if (tiltStartRef.current === null) tiltStartRef.current = t
      const elapsed = t - tiltStartRef.current
      const prog = Math.min(elapsed / 1.2, 1)
      const ease = 1 - Math.pow(1 - prog, 3)
      groupRef.current.rotation.z = ease * 0.55
      groupRef.current.position.x = ease * 0.3
      groupRef.current.position.y = ease * 0.15
      if (prog >= 1 && !tiltDoneRef.current) {
        tiltDoneRef.current = true
        onTiltDone?.()
      }
    } else {
      // 待機：ふわふわ
      groupRef.current.rotation.z += (-groupRef.current.rotation.z) * 0.05
      groupRef.current.position.y += (Math.sin(t * 1.2) * 0.06 - groupRef.current.position.y) * 0.03
      tiltStartRef.current = null
      tiltDoneRef.current = false
    }
  })

  return (
    <group ref={groupRef}>
      {/* 筒本体 */}
      <mesh geometry={hexGeo} castShadow>
        <meshStandardMaterial
          color="#c8882c"
          roughness={0.55}
          metalness={0.10}
          envMapIntensity={0.6}
        />
      </mesh>

      {/* 木目テクスチャ（ライン） */}
      {[0.4, 0.15, -0.15, -0.4, -0.7].map((y, i) => (
        <mesh key={i} position={[0, y, 0.545]}>
          <planeGeometry args={[0.82, 0.012]} />
          <meshBasicMaterial color="#7a4010" transparent opacity={0.15} />
        </mesh>
      ))}

      {/* 金帯（上） */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.558, 0.558, 0.62, 6]} />
        <meshStandardMaterial
          color="#f0c828"
          roughness={0.18}
          metalness={0.85}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* 御神籤 テキストプレート（正面に薄い板） */}
      <mesh position={[0, 0.25, 0.52]}>
        <planeGeometry args={[0.72, 0.52]} />
        <meshStandardMaterial color="#1a0800" roughness={0.5} metalness={0.0} transparent opacity={0.7} />
      </mesh>

      {/* 上蓋 */}
      <mesh position={[0, 1.12, 0]}>
        <cylinderGeometry args={[0.52, 0.55, 0.08, 6]} />
        <meshStandardMaterial color="#a06018" roughness={0.45} metalness={0.08} />
      </mesh>

      {/* 穴（上面） */}
      <mesh position={[0, 1.16, 0]}>
        <cylinderGeometry args={[0.10, 0.10, 0.06, 12]} />
        <meshStandardMaterial color="#060300" roughness={1.0} metalness={0.0} />
      </mesh>

      {/* 底面 */}
      <mesh position={[0, -1.12, 0]}>
        <cylinderGeometry args={[0.50, 0.53, 0.10, 6]} />
        <meshStandardMaterial color="#7a3e10" roughness={0.6} metalness={0.05} />
      </mesh>

      {/* シャカシャカ：棒がピョコピョコ */}
      {shaking && [0, 1, 2, 3, 4].map(i => (
        <MikujiBo key={i} index={i} shaking={shaking} visible={shaking} stickNumber={stickNumber} />
      ))}

      {/* 傾け中：棒がスライドアウト */}
      {tilting && <EjectingStick stickNumber={stickNumber} />}
    </group>
  )
}

// ── 床（反射） ────────────────────────────────────
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.0, 0]} receiveShadow>
      <planeGeometry args={[12, 12]} />
      <MeshReflectorMaterial
        blur={[400, 100]}
        resolution={512}
        mixBlur={0.8}
        mixStrength={12}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#0a1020"
        metalness={0.5}
        mirror={0}
      />
    </mesh>
  )
}

// ── パーティクル（シャカシャカ時の雰囲気） ───────
function ShakeParticles({ active }: { active: boolean }) {
  const pointsRef = useRef<THREE.Points>(null!)
  const positions = useMemo(() => {
    const arr = new Float32Array(60 * 3)
    for (let i = 0; i < 60; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 3
      arr[i * 3 + 1] = (Math.random() - 0.5) * 3
      arr[i * 3 + 2] = (Math.random() - 0.5) * 1.5
    }
    return arr
  }, [])
  const speeds = useMemo(() => Array.from({ length: 60 }, () => 0.3 + Math.random() * 0.7), [])

  useFrame((state) => {
    if (!pointsRef.current || !active) return
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array
    const t = state.clock.elapsedTime
    for (let i = 0; i < 60; i++) {
      pos[i * 3 + 1] = Math.sin(t * speeds[i] + i) * 1.2
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    const mat = pointsRef.current.material as THREE.PointsMaterial
    mat.opacity = active ? 0.25 : 0
  })

  if (!active) return null
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#e8d070" size={0.025} transparent opacity={0.25} sizeAttenuation />
    </points>
  )
}

// ── メイン 3Dシーン ────────────────────────────────
interface OmikujiScene3DProps {
  shaking: boolean
  tilting: boolean
  stickNumber: number
  onTiltDone?: () => void
}

export default function OmikujiScene3D({ shaking, tilting, stickNumber, onTiltDone }: OmikujiScene3DProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <Canvas
        shadows
        camera={{ position: [0, 0.5, 5.5], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        {/* ライティング */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[3, 6, 4]}
          intensity={1.8}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-2, 3, 2]} intensity={0.8} color="#b0c8ff" />
        <pointLight position={[0, -1, 3]} intensity={0.3} color="#ffd090" />
        <spotLight
          position={[0, 5, 3]}
          angle={0.4}
          penumbra={0.6}
          intensity={1.2}
          castShadow
          color="#fff8f0"
        />

        {/* HDR環境マップ */}
        <Environment preset="city" />

        {/* 床（反射） */}
        <Floor />

        {/* パーティクル */}
        <ShakeParticles active={shaking} />

        {/* おみくじ筒 */}
        <OmikujiTube
          shaking={shaking}
          tilting={tilting}
          stickNumber={stickNumber}
          onTiltDone={onTiltDone}
        />
      </Canvas>
    </div>
  )
}
