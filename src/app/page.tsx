'use client'

import { useState, useRef, useEffect } from 'react'

const LUCKY_ITEMS = [
  { category: 'カラー', items: ['金色', '白', '赤', '紺', '紫', '緑', '桃色', '橙', '水色', '黄色'] },
  { category: 'アイテム', items: ['桜の花びら', '招き猫', '四つ葉のクローバー', '富士山', '鶴', '亀', '梅の花', '打ち出の小槌', '宝船', '松の葉'] },
  { category: '食べ物', items: ['赤飯', '鯛', '饅頭', '栗', 'みかん', '柚子', '昆布', '梅干し', 'お餅', '甘酒'] },
  { category: '方角', items: ['北', '南', '東', '西', '北東', '南西', '北西', '南東'] },
  { category: '時間帯', items: ['朝', '昼', '夕方', '夜', '夜明け', '日没時'] },
]

const FORTUNES = [
  {
    result: '大吉',
    reading: 'だいきち',
    color: '#FFD700',
    glow: 'rgba(255, 215, 0, 0.8)',
    message: '最高の運気！何事も思い通りに進むでしょう。積極的な行動が吉。',
    detail: { 願望: '必ず叶う', 恋愛: '最高の出会いあり', 仕事: '大きな成果が期待できる', 健康: '非常に良好' },
  },
  {
    result: '吉',
    reading: 'きち',
    color: '#FF8C00',
    glow: 'rgba(255, 140, 0, 0.8)',
    message: '良い運気が流れています。積極的に行動しましょう。',
    detail: { 願望: '叶う', 恋愛: '良縁あり', 仕事: '順調に進む', 健康: '良好' },
  },
  {
    result: '中吉',
    reading: 'ちゅうきち',
    color: '#90EE90',
    glow: 'rgba(144, 238, 144, 0.8)',
    message: '穏やかな運気。焦らず着実に進みましょう。',
    detail: { 願望: 'やや叶う', 恋愛: '発展の兆し', 仕事: '堅実に進む', 健康: 'まずまず' },
  },
  {
    result: '小吉',
    reading: 'しょうきち',
    color: '#87CEEB',
    glow: 'rgba(135, 206, 235, 0.8)',
    message: '小さな幸運が積み重なります。丁寧に過ごしましょう。',
    detail: { 願望: '少し叶う', 恋愛: 'ゆっくり育む', 仕事: '地道に努力を', 健康: '無理は禁物' },
  },
  {
    result: '末吉',
    reading: 'すえきち',
    color: '#DDA0DD',
    glow: 'rgba(221, 160, 221, 0.8)',
    message: '今は種まきの時。将来に向けて準備を重ねましょう。',
    detail: { 願望: '待てば叶う', 恋愛: '焦らないで', 仕事: '準備期間', 健康: '養生が大切' },
  },
  {
    result: '凶',
    reading: 'きょう',
    color: '#C0C0C0',
    glow: 'rgba(192, 192, 192, 0.6)',
    message: '慎重に行動する時。嵐の後には必ず晴れ間が待っています。',
    detail: { 願望: '今は難しい', 恋愛: '慎重に', 仕事: '焦らず見直しを', 健康: '注意が必要' },
  },
]

function getLuckyItems() {
  return LUCKY_ITEMS.map(cat => ({
    category: cat.category,
    value: cat.items[Math.floor(Math.random() * cat.items.length)],
  }))
}

type Phase = 'shaking' | 'stick' | 'result'

export default function OmikujiApp() {
  const [phase, setPhase] = useState<Phase>('shaking')
  const [fortune, setFortune] = useState<(typeof FORTUNES)[0]>(() => FORTUNES[Math.floor(Math.random() * FORTUNES.length)])
  const [stickNumber] = useState(() => Math.floor(Math.random() * 100) + 1)
  const [luckyItems] = useState(getLuckyItems)
  const [particles, setParticles] = useState<{ id: number; left: number; tx: number }[]>([])
  const shakeVideoRef = useRef<HTMLVideoElement>(null)
  const stickVideoRef = useRef<HTMLVideoElement>(null)
  const voiceShakingRef = useRef<HTMLAudioElement>(null)
  const voiceStickRef = useRef<HTMLAudioElement>(null)
  const voiceResultRef = useRef<HTMLAudioElement>(null)

  // 最初から自動でシャカシャカ開始
  useEffect(() => {
    if (phase === 'shaking' && shakeVideoRef.current) {
      shakeVideoRef.current.currentTime = 0
      shakeVideoRef.current.play().catch(() => {})
      voiceShakingRef.current?.play().catch(() => {})
      const timer = setTimeout(() => setPhase('stick'), 3000)
      return () => clearTimeout(timer)
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'stick' && stickVideoRef.current) {
      stickVideoRef.current.currentTime = 0
      stickVideoRef.current.play().catch(() => {})
      voiceStickRef.current?.play().catch(() => {})
      const timer = setTimeout(() => {
        setPhase('result')
        setParticles(
          Array.from({ length: 24 }, (_, i) => ({
            id: i,
            left: 20 + Math.random() * 60,
            tx: (Math.random() - 0.5) * 240,
          }))
        )
        voiceResultRef.current?.play().catch(() => {})
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [phase])

  const handleReset = () => {
    const newFortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)]
    setFortune(newFortune)
    setParticles([])
    setPhase('shaking')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #2d0f00 0%, #1a0a00 60%, #0a0500 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* bg dot pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(180,100,0,0.07) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Audio */}
      <audio ref={voiceShakingRef} src="/audio/voice_shaking.mp3" />
      <audio ref={voiceStickRef} src="/audio/voice_stick.mp3" />
      <audio ref={voiceResultRef} src="/audio/voice_result.mp3" />

      {/* Header */}
      <div style={{
        position: 'absolute', top: '20px', left: 0, right: 0,
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.4em', color: '#8b6914', opacity: 0.7 }}>✦ 今日の運勢 ✦</div>
        <div style={{
          fontSize: 'clamp(22px, 5vw, 32px)',
          fontWeight: 'bold',
          letterSpacing: '0.25em',
          background: 'linear-gradient(180deg, #ffd700, #b8860b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>おみくじ</div>
      </div>

      {/* SHAKING */}
      {phase === 'shaking' && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease forwards' }}>
          <div style={{
            width: 'min(320px, 88vw)',
            margin: '0 auto',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(255, 150, 0, 0.25)',
          }}>
            <video ref={shakeVideoRef} src="/videos/shake_v1.mp4" muted playsInline style={{ width: '100%', display: 'block' }} />
          </div>
          <div style={{ marginTop: '16px', fontSize: '14px', color: '#b8860b', letterSpacing: '0.25em' }}>
            ✦ シャカシャカ… ✦
          </div>
        </div>
      )}

      {/* STICK OUT */}
      {phase === 'stick' && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease forwards' }}>
          <div style={{
            width: 'min(320px, 88vw)',
            margin: '0 auto',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(255, 150, 0, 0.25)',
          }}>
            <video ref={stickVideoRef} src="/videos/stick_out_v2.mp4" muted playsInline style={{ width: '100%', display: 'block' }} />
          </div>
          <div style={{ marginTop: '16px', fontSize: '24px', fontWeight: 'bold', color: '#ffd700', letterSpacing: '0.2em' }}>
            第 {stickNumber} 番
          </div>
        </div>
      )}

      {/* RESULT */}
      {phase === 'result' && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.6s ease forwards', padding: '16px 20px 20px', width: '100%', maxWidth: '460px' }}>
          {/* Particles */}
          {particles.map(p => (
            <div key={p.id} style={{
              position: 'fixed',
              left: `${p.left}%`,
              top: '50%',
              width: '7px', height: '7px',
              borderRadius: '50%',
              background: fortune.color,
              animation: `particleFly 1.2s ease-out ${p.id * 0.04}s forwards`,
              '--tx': `${p.tx}px`,
              pointerEvents: 'none',
            } as React.CSSProperties} />
          ))}

          <div style={{ fontSize: '12px', color: '#b8860b', letterSpacing: '0.3em', marginBottom: '4px' }}>第 {stickNumber} 番</div>

          {/* 運勢 */}
          <div style={{
            fontSize: 'clamp(56px, 18vw, 90px)',
            fontWeight: 'bold',
            letterSpacing: '0.1em',
            color: fortune.color,
            textShadow: `0 0 30px ${fortune.glow}, 0 0 60px ${fortune.glow}`,
            animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, shimmer 2s ease-in-out infinite',
            marginBottom: '2px',
            lineHeight: 1,
          }}>
            {fortune.result}
          </div>
          <div style={{ fontSize: '13px', color: '#8b7040', letterSpacing: '0.3em', marginBottom: '16px' }}>{fortune.reading}</div>

          {/* メッセージ＋運勢詳細 */}
          <div style={{
            background: 'rgba(255, 200, 50, 0.04)',
            border: `1px solid ${fortune.color}40`,
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '14px',
          }}>
            <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#e8d5a0', marginBottom: '14px' }}>
              {fortune.message}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              {Object.entries(fortune.detail).map(([key, value]) => (
                <div key={key} style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '6px',
                  padding: '9px 10px',
                  borderLeft: `3px solid ${fortune.color}`,
                }}>
                  <div style={{ fontSize: '10px', color: '#8b7040', marginBottom: '3px', letterSpacing: '0.1em' }}>{key}</div>
                  <div style={{ fontSize: '13px', color: '#f5e6c8', fontWeight: 'bold' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* ラッキーアイテム */}
            <div style={{
              borderTop: `1px solid ${fortune.color}30`,
              paddingTop: '12px',
            }}>
              <div style={{ fontSize: '11px', color: '#b8860b', letterSpacing: '0.3em', marginBottom: '10px' }}>
                ✦ ラッキー ✦
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {luckyItems.map(item => (
                  <div key={item.category} style={{
                    background: 'rgba(0,0,0,0.25)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    borderBottom: `2px solid ${fortune.color}60`,
                  }}>
                    <div style={{ fontSize: '10px', color: '#8b7040', marginBottom: '3px', letterSpacing: '0.05em' }}>{item.category}</div>
                    <div style={{ fontSize: '13px', color: fortune.color, fontWeight: 'bold' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleReset}
            style={{
              padding: '13px 44px',
              fontSize: '15px',
              fontFamily: 'inherit',
              letterSpacing: '0.3em',
              background: 'transparent',
              color: '#ffd700',
              border: '1px solid #ffd70055',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.25s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,215,0,0.1)'
              e.currentTarget.style.borderColor = '#ffd700'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = '#ffd70055'
            }}
          >
            もう一度引く
          </button>
        </div>
      )}
    </div>
  )
}
