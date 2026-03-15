'use client'

import { useState, useRef, useEffect } from 'react'

const FORTUNES = [
  {
    result: '大吉',
    reading: 'だいきち',
    color: '#FFD700',
    glow: 'rgba(255, 215, 0, 0.8)',
    message: '最高の運気！何事も思い通りに進むでしょう。',
    detail: {
      願望: '必ず叶う',
      恋愛: '最高の出会いあり',
      仕事: '大きな成果が期待できる',
      健康: '非常に良好',
    },
  },
  {
    result: '吉',
    reading: 'きち',
    color: '#FF8C00',
    glow: 'rgba(255, 140, 0, 0.8)',
    message: '良い運気が流れています。積極的に行動を。',
    detail: {
      願望: '叶う',
      恋愛: '良縁あり',
      仕事: '順調に進む',
      健康: '良好',
    },
  },
  {
    result: '中吉',
    reading: 'ちゅうきち',
    color: '#90EE90',
    glow: 'rgba(144, 238, 144, 0.8)',
    message: '穏やかな運気。焦らず着実に進みましょう。',
    detail: {
      願望: 'やや叶う',
      恋愛: '発展の兆し',
      仕事: '堅実に進む',
      健康: 'まずまず',
    },
  },
  {
    result: '小吉',
    reading: 'しょうきち',
    color: '#87CEEB',
    glow: 'rgba(135, 206, 235, 0.8)',
    message: '小さな幸運が積み重なります。丁寧に。',
    detail: {
      願望: '少し叶う',
      恋愛: 'ゆっくり育む',
      仕事: '地道に努力を',
      健康: '無理は禁物',
    },
  },
  {
    result: '末吉',
    reading: 'すえきち',
    color: '#DDA0DD',
    glow: 'rgba(221, 160, 221, 0.8)',
    message: '今は種まきの時。将来に向けて準備を。',
    detail: {
      願望: '待てば叶う',
      恋愛: '焦らないで',
      仕事: '準備期間',
      健康: '養生が大切',
    },
  },
  {
    result: '凶',
    reading: 'きょう',
    color: '#C0C0C0',
    glow: 'rgba(192, 192, 192, 0.6)',
    message: '慎重に行動する時。嵐の後には晴れ間が待つ。',
    detail: {
      願望: '今は難しい',
      恋愛: '慎重に',
      仕事: '焦らず見直しを',
      健康: '注意が必要',
    },
  },
]

type Phase = 'start' | 'shaking' | 'stick' | 'result'

export default function OmikujiApp() {
  const [phase, setPhase] = useState<Phase>('start')
  const [fortune, setFortune] = useState<(typeof FORTUNES)[0] | null>(null)
  const [stickNumber, setStickNumber] = useState(0)
  const [particles, setParticles] = useState<number[]>([])
  const shakeVideoRef = useRef<HTMLVideoElement>(null)
  const stickVideoRef = useRef<HTMLVideoElement>(null)
  const voiceShakingRef = useRef<HTMLAudioElement>(null)
  const voiceStickRef = useRef<HTMLAudioElement>(null)
  const voiceResultRef = useRef<HTMLAudioElement>(null)

  const handleStart = () => {
    const num = Math.floor(Math.random() * 100) + 1
    const fortuneIndex = Math.floor(Math.random() * FORTUNES.length)
    setStickNumber(num)
    setFortune(FORTUNES[fortuneIndex])
    setPhase('shaking')

    // Play voice
    if (voiceShakingRef.current) {
      voiceShakingRef.current.currentTime = 0
      voiceShakingRef.current.play().catch(() => {})
    }
  }

  useEffect(() => {
    if (phase === 'shaking' && shakeVideoRef.current) {
      shakeVideoRef.current.currentTime = 0
      shakeVideoRef.current.play().catch(() => {})

      const timer = setTimeout(() => {
        setPhase('stick')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'stick' && stickVideoRef.current) {
      stickVideoRef.current.currentTime = 0
      stickVideoRef.current.play().catch(() => {})
      if (voiceStickRef.current) {
        voiceStickRef.current.currentTime = 0
        voiceStickRef.current.play().catch(() => {})
      }

      const timer = setTimeout(() => {
        setPhase('result')
        setParticles(Array.from({ length: 20 }, (_, i) => i))
        if (voiceResultRef.current) {
          voiceResultRef.current.currentTime = 0
          voiceResultRef.current.play().catch(() => {})
        }
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [phase])

  const handleReset = () => {
    setPhase('start')
    setFortune(null)
    setParticles([])
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
      {/* Background pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(180,100,0,0.08) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Audio */}
      <audio ref={voiceShakingRef} src="/audio/voice_shaking.mp3" />
      <audio ref={voiceStickRef} src="/audio/voice_stick.mp3" />
      <audio ref={voiceResultRef} src="/audio/voice_result.mp3" />

      {/* START SCREEN */}
      {phase === 'start' && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.8s ease forwards' }}>
          <div style={{ marginBottom: '16px', fontSize: '14px', letterSpacing: '0.3em', color: '#b8860b', opacity: 0.8 }}>
            ✦ 今日の運勢 ✦
          </div>
          <h1 style={{
            fontSize: 'clamp(48px, 12vw, 80px)',
            fontWeight: 'bold',
            letterSpacing: '0.2em',
            marginBottom: '8px',
            background: 'linear-gradient(180deg, #ffd700, #b8860b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: 'none',
          }}>
            おみくじ
          </h1>
          <div style={{ fontSize: '13px', color: '#8b6914', letterSpacing: '0.2em', marginBottom: '60px' }}>
            OMIKUJI FORTUNE
          </div>

          {/* Decorative torii */}
          <div style={{ fontSize: '60px', marginBottom: '40px', animation: 'float 3s ease-in-out infinite' }}>
            ⛩️
          </div>

          <button
            onClick={handleStart}
            style={{
              padding: '18px 60px',
              fontSize: '20px',
              fontFamily: 'inherit',
              letterSpacing: '0.3em',
              background: 'linear-gradient(135deg, #8b0000, #cc0000)',
              color: '#ffd700',
              border: '2px solid #ffd700',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 0 20px rgba(200, 0, 0, 0.4)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 0 40px rgba(255, 100, 0, 0.8)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(200, 0, 0, 0.4)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            おみくじを引く
          </button>

          <div style={{ marginTop: '30px', fontSize: '12px', color: '#5a4020', letterSpacing: '0.1em' }}>
            心を静め、ボタンを押してください
          </div>
        </div>
      )}

      {/* SHAKING SCENE */}
      {phase === 'shaking' && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease forwards' }}>
          <div style={{ marginBottom: '20px', fontSize: '16px', letterSpacing: '0.3em', color: '#ffd700' }}>
            おみくじを振っています...
          </div>
          <div style={{
            width: 'min(360px, 90vw)',
            margin: '0 auto',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(255, 150, 0, 0.3)',
          }}>
            <video
              ref={shakeVideoRef}
              src="/videos/shake_v1.mp4"
              muted
              playsInline
              style={{ width: '100%', display: 'block' }}
            />
          </div>
          <div style={{ marginTop: '20px', fontSize: '14px', color: '#b8860b', letterSpacing: '0.2em' }}>
            ✦ シャカシャカ… ✦
          </div>
        </div>
      )}

      {/* STICK OUT SCENE */}
      {phase === 'stick' && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease forwards' }}>
          <div style={{ marginBottom: '20px', fontSize: '16px', letterSpacing: '0.3em', color: '#ffd700' }}>
            棒が出てきました...
          </div>
          <div style={{
            width: 'min(360px, 90vw)',
            margin: '0 auto',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(255, 150, 0, 0.3)',
          }}>
            <video
              ref={stickVideoRef}
              src="/videos/stick_out_v2.mp4"
              muted
              playsInline
              style={{ width: '100%', display: 'block' }}
            />
          </div>
          <div style={{
            marginTop: '20px',
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#ffd700',
            letterSpacing: '0.2em',
          }}>
            第 {stickNumber} 番
          </div>
        </div>
      )}

      {/* RESULT SCREEN */}
      {phase === 'result' && fortune && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.8s ease forwards', padding: '20px', width: '100%', maxWidth: '480px' }}>
          {/* Particles */}
          {particles.map(i => (
            <div key={i} style={{
              position: 'fixed',
              left: `${30 + Math.random() * 40}%`,
              top: '50%',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: fortune.color,
              animation: `particleFly 1.5s ease-out ${i * 0.05}s forwards`,
              '--tx': `${(Math.random() - 0.5) * 200}px`,
              pointerEvents: 'none',
            } as React.CSSProperties} />
          ))}

          <div style={{ fontSize: '13px', color: '#b8860b', letterSpacing: '0.3em', marginBottom: '8px' }}>
            第 {stickNumber} 番
          </div>

          {/* Fortune result */}
          <div style={{
            fontSize: 'clamp(64px, 20vw, 100px)',
            fontWeight: 'bold',
            letterSpacing: '0.1em',
            color: fortune.color,
            textShadow: `0 0 30px ${fortune.glow}, 0 0 60px ${fortune.glow}`,
            animation: 'scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, shimmer 2s ease-in-out infinite',
            marginBottom: '4px',
          }}>
            {fortune.result}
          </div>
          <div style={{ fontSize: '14px', color: '#8b7040', letterSpacing: '0.3em', marginBottom: '24px' }}>
            {fortune.reading}
          </div>

          <div style={{
            background: 'rgba(255, 200, 50, 0.05)',
            border: `1px solid ${fortune.color}44`,
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#e8d5a0', marginBottom: '20px' }}>
              {fortune.message}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {Object.entries(fortune.detail).map(([key, value]) => (
                <div key={key} style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '6px',
                  padding: '10px',
                  borderLeft: `3px solid ${fortune.color}`,
                }}>
                  <div style={{ fontSize: '11px', color: '#8b7040', marginBottom: '4px', letterSpacing: '0.1em' }}>{key}</div>
                  <div style={{ fontSize: '13px', color: '#f5e6c8', fontWeight: 'bold' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleReset}
            style={{
              padding: '14px 48px',
              fontSize: '16px',
              fontFamily: 'inherit',
              letterSpacing: '0.3em',
              background: 'transparent',
              color: '#ffd700',
              border: '1px solid #ffd70066',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)'
              e.currentTarget.style.borderColor = '#ffd700'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = '#ffd70066'
            }}
          >
            もう一度引く
          </button>
        </div>
      )}
    </div>
  )
}
