'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

const LUCKY_ITEMS = [
  { category: 'ラッキーカラー', items: ['金色', '白', '赤', '紺', '紫', '緑', '桃色', '橙', '水色', '黄色'] },
  { category: 'ラッキーアイテム', items: ['桜の花びら', '招き猫', '四つ葉', '富士山', '鶴', '亀', '梅の花', '打ち出の小槌', '宝船', '松の葉'] },
  { category: 'ラッキーフード', items: ['赤飯', '鯛', '饅頭', '栗', 'みかん', '柚子', '昆布', '梅干し', 'お餅', '甘酒'] },
  { category: 'ラッキー方角', items: ['北', '南', '東', '西', '北東', '南西', '北西', '南東'] },
  { category: 'ラッキータイム', items: ['朝', '昼', '夕方', '夜', '夜明け', '日没時'] },
  { category: 'ラッキー数字', items: ['1', '3', '5', '7', '8', '11', '15', '21', '33', '88'] },
]

const FORTUNES = [
  {
    id: 'daikichi',
    result: '大吉',
    reading: 'だいきち',
    color: '#FF8C00',
    bg: 'linear-gradient(160deg, #fff8e8 0%, #ffe4a0 40%, #ffd060 100%)',
    textColor: '#5a3000',
    cardBg: 'rgba(255,255,255,0.75)',
    cardBorder: '#f0c040',
    shimmer: 'shimmerGold',
    anim: 'scaleIn 0.5s cubic-bezier(0.34,1.8,0.64,1) forwards',
    message: '最高の運気！天の恵みがあなたに降り注いでいます。何事も恐れず、大きく踏み出しましょう。',
  },
  {
    id: 'kichi',
    result: '吉',
    reading: 'きち',
    color: '#d45000',
    bg: 'linear-gradient(160deg, #f5f0e8 0%, #e8d8c0 100%)',
    textColor: '#3a2010',
    cardBg: 'rgba(255,255,255,0.8)',
    cardBorder: '#c09060',
    shimmer: 'shimmerNormal',
    anim: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
    message: '良い運気が流れています。積極的に行動することで、さらなる幸運を引き寄せられます。',
  },
  {
    id: 'chukichi',
    result: '中吉',
    reading: 'ちゅうきち',
    color: '#2a7a2a',
    bg: 'linear-gradient(160deg, #f0f5f0 0%, #d8ead8 100%)',
    textColor: '#1a3a1a',
    cardBg: 'rgba(255,255,255,0.8)',
    cardBorder: '#80c080',
    shimmer: 'shimmerNormal',
    anim: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
    message: '穏やかな運気。焦らず着実に一歩一歩進むことが開運の鍵です。',
  },
  {
    id: 'shokichi',
    result: '小吉',
    reading: 'しょうきち',
    color: '#1a6090',
    bg: 'linear-gradient(160deg, #f0f4f8 0%, #d0e4f0 100%)',
    textColor: '#102030',
    cardBg: 'rgba(255,255,255,0.8)',
    cardBorder: '#70b0d8',
    shimmer: 'shimmerNormal',
    anim: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
    message: '小さな幸運が積み重なります。日々の丁寧な行いが運勢を高めていきます。',
  },
  {
    id: 'suekichi',
    result: '末吉',
    reading: 'すえきち',
    color: '#6a3a8a',
    bg: 'linear-gradient(160deg, #f4f0f8 0%, #e0d0f0 100%)',
    textColor: '#2a1040',
    cardBg: 'rgba(255,255,255,0.8)',
    cardBorder: '#a880d0',
    shimmer: 'shimmerNormal',
    anim: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
    message: '今は種まきの時。焦らずに準備を重ねれば、必ず花開く日が来ます。',
  },
  {
    id: 'kyo',
    result: '凶',
    reading: 'きょう',
    color: '#606070',
    bg: 'linear-gradient(160deg, #2a2a35 0%, #1a1a25 60%, #0f0f18 100%)',
    textColor: '#c0c8d8',
    cardBg: 'rgba(40,45,60,0.85)',
    cardBorder: '#505060',
    shimmer: 'shimmerGray',
    anim: 'sadDrop 0.7s cubic-bezier(0.22,1,0.36,1) forwards',
    message: '嵐の前の静けさ。今は耐える時。慎重に行動することで、必ず光が差し込んできます。',
  },
]

function getLuckyItems() {
  return LUCKY_ITEMS.map(cat => ({
    category: cat.category,
    value: cat.items[Math.floor(Math.random() * cat.items.length)],
  }))
}

type Phase = 'shaking' | 'stick' | 'result'

function StarBurst() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      {Array.from({ length: 40 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${10 + Math.random() * 80}%`,
          top: '-10px',
          width: `${6 + Math.random() * 10}px`,
          height: `${10 + Math.random() * 14}px`,
          background: ['#FFD700','#FF6347','#FF69B4','#87CEEB','#98FB98','#FFA500'][i % 6],
          borderRadius: '2px',
          animation: `confettiFall ${1.5 + Math.random() * 2.5}s ease-in ${i * 0.07}s forwards`,
        }} />
      ))}
    </div>
  )
}

function RainEffect() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      {Array.from({ length: 25 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: '-40px',
          width: '1px',
          height: `${30 + Math.random() * 40}px`,
          background: 'linear-gradient(to bottom, transparent, rgba(160,180,210,0.5))',
          animation: `rainFall ${1 + Math.random() * 1.5}s linear ${i * 0.15}s infinite`,
        }} />
      ))}
    </div>
  )
}

export default function OmikujiApp() {
  const [phase, setPhase] = useState<Phase>('shaking')
  const [fortune] = useState<(typeof FORTUNES)[0]>(() => FORTUNES[Math.floor(Math.random() * FORTUNES.length)])
  const [currentFortune, setCurrentFortune] = useState(fortune)
  const [stickNumber] = useState(() => Math.floor(Math.random() * 50) + 1)
  const [luckyItems] = useState(getLuckyItems)
  const [showEffects, setShowEffects] = useState(false)
  const shakeVideoRef = useRef<HTMLVideoElement>(null)
  const stickVideoRef = useRef<HTMLVideoElement>(null)
  const voiceShakingRef = useRef<HTMLAudioElement>(null)
  const voiceStickRef = useRef<HTMLAudioElement>(null)
  const voiceResultRef = useRef<HTMLAudioElement>(null)

  const isDaikichi = currentFortune.id === 'daikichi'
  const isKyo = currentFortune.id === 'kyo'

  useEffect(() => {
    if (phase === 'shaking' && shakeVideoRef.current) {
      shakeVideoRef.current.currentTime = 0
      shakeVideoRef.current.play().catch(() => {})
      voiceShakingRef.current?.play().catch(() => {})
      const t = setTimeout(() => setPhase('stick'), 3500)
      return () => clearTimeout(t)
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'stick' && stickVideoRef.current) {
      stickVideoRef.current.currentTime = 0
      stickVideoRef.current.play().catch(() => {})
      voiceStickRef.current?.play().catch(() => {})
      const t = setTimeout(() => {
        setPhase('result')
        setTimeout(() => setShowEffects(true), 500)
        voiceResultRef.current?.play().catch(() => {})
      }, 3500)
      return () => clearTimeout(t)
    }
  }, [phase])

  const handleReset = useCallback(() => {
    setShowEffects(false)
    const next = FORTUNES[Math.floor(Math.random() * FORTUNES.length)]
    setCurrentFortune(next)
    setPhase('shaking')
  }, [])

  const bg = phase === 'result' ? currentFortune.bg : 'linear-gradient(160deg, #e8f0f8 0%, #d0dff0 100%)'
  const textColor = phase === 'result' ? currentFortune.textColor : '#1a2840'

  return (
    <div style={{
      minHeight: '100vh',
      background: bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      transition: 'background 0.8s ease',
      color: textColor,
    }}>
      {phase === 'result' && showEffects && isDaikichi && <StarBurst />}
      {phase === 'result' && showEffects && isKyo && <RainEffect />}

      <audio ref={voiceShakingRef} src="/audio/voice_shaking.mp3" />
      <audio ref={voiceStickRef} src="/audio/voice_stick.mp3" />
      <audio ref={voiceResultRef} src="/audio/voice_result.mp3" />

      {/* ヘッダー */}
      <div style={{
        position: 'absolute', top: '16px', left: 0, right: 0,
        textAlign: 'center', pointerEvents: 'none', zIndex: 5,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          animation: 'logoGlow 3s ease-in-out infinite',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M12 21C12 21 2 13.5 2 8C2 5.2 4.2 3 7 3C8.8 3 10.4 3.9 11.4 5.3C12.4 3.9 14 3 15.8 3C18.6 3 21 5.2 21 8C21 13.5 12 21 12 21Z"
              fill="rgba(80,150,255,0.85)" />
          </svg>
          <span style={{ fontSize: '10px', letterSpacing: '0.35em', color: 'rgba(60,120,220,0.9)', fontWeight: '600' }}>
            KATAOMOI INC.
          </span>
        </div>
        <div style={{
          fontSize: 'clamp(20px, 5vw, 28px)',
          fontWeight: 'bold',
          letterSpacing: '0.3em',
          color: isKyo ? 'rgba(160,180,210,0.9)' : '#1a4a90',
          filter: 'drop-shadow(0 0 6px rgba(100,160,255,0.4))',
          marginTop: '2px',
        }}>おみくじ</div>
      </div>

      {/* SHAKING */}
      {phase === 'shaking' && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease forwards', paddingTop: '80px' }}>
          <div style={{
            width: 'min(320px, 88vw)',
            margin: '0 auto',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 30px rgba(0,0,0,0.25), 0 0 0 2px rgba(255,255,255,0.6)',
            background: '#fff',
          }}>
            <video ref={shakeVideoRef} src="/videos/shake_v1.mp4" muted playsInline style={{ width: '100%', display: 'block' }} />
          </div>
          <div style={{ marginTop: '16px', fontSize: '14px', color: '#4a70a0', letterSpacing: '0.3em' }}>
            ✦ シャカシャカ… ✦
          </div>
        </div>
      )}

      {/* STICK */}
      {phase === 'stick' && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease forwards', paddingTop: '80px' }}>
          <div style={{
            width: 'min(320px, 88vw)',
            margin: '0 auto',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 30px rgba(0,0,0,0.25), 0 0 0 2px rgba(255,255,255,0.6)',
            background: '#fff',
          }}>
            <video ref={stickVideoRef} src="/videos/stick_out_v2.mp4" muted playsInline style={{ width: '100%', display: 'block' }} />
          </div>
          <div style={{
            marginTop: '16px',
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#1a3a70',
            letterSpacing: '0.2em',
          }}>
            第 {stickNumber} 番
          </div>
        </div>
      )}

      {/* RESULT */}
      {phase === 'result' && (
        <div style={{
          textAlign: 'center',
          animation: 'fadeIn 0.5s ease forwards',
          padding: '75px 20px 24px',
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.3em', opacity: 0.6, marginBottom: '4px' }}>
            第 {stickNumber} 番
          </div>

          {/* 運勢 */}
          <div style={{
            fontSize: 'clamp(72px, 22vw, 108px)',
            fontWeight: 'bold',
            color: currentFortune.color,
            animation: `${currentFortune.anim}, ${currentFortune.shimmer} 2s ease-in-out 0.6s infinite`,
            lineHeight: 1,
            marginBottom: '4px',
          }}>
            {currentFortune.result}
          </div>
          <div style={{ fontSize: '13px', letterSpacing: '0.3em', opacity: 0.65, marginBottom: '20px' }}>
            {currentFortune.reading}
          </div>

          {/* カード */}
          <div style={{
            background: currentFortune.cardBg,
            border: `1.5px solid ${currentFortune.cardBorder}`,
            borderRadius: '14px',
            padding: '18px',
            marginBottom: '16px',
            backdropFilter: 'blur(12px)',
            boxShadow: isDaikichi
              ? '0 4px 30px rgba(255,180,0,0.2)'
              : isKyo
              ? '0 4px 20px rgba(0,0,0,0.4)'
              : '0 4px 20px rgba(0,0,0,0.1)',
          }}>
            <p style={{
              fontSize: '14px',
              lineHeight: '1.9',
              marginBottom: '16px',
              color: isKyo ? 'rgba(200,210,225,0.9)' : currentFortune.textColor,
            }}>
              {currentFortune.message}
            </p>

            {/* ラッキーアイテム */}
            {!isKyo ? (
              <>
                <div style={{
                  borderTop: `1px solid ${currentFortune.cardBorder}`,
                  paddingTop: '14px',
                  marginBottom: '10px',
                  fontSize: '11px',
                  letterSpacing: '0.35em',
                  opacity: 0.65,
                }}>✦ ラッキー ✦</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {luckyItems.map(item => (
                    <div key={item.category} style={{
                      background: isDaikichi ? 'rgba(255,200,0,0.12)' : 'rgba(0,0,0,0.06)',
                      borderRadius: '8px',
                      padding: '8px 6px',
                      borderBottom: `2px solid ${currentFortune.cardBorder}`,
                    }}>
                      <div style={{ fontSize: '9px', opacity: 0.55, marginBottom: '4px', letterSpacing: '0.05em' }}>
                        {item.category.replace('ラッキー', '')}
                      </div>
                      <div style={{ fontSize: '13px', color: currentFortune.color, fontWeight: 'bold' }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{
                borderTop: `1px solid ${currentFortune.cardBorder}`,
                paddingTop: '12px',
                fontSize: '13px',
                color: 'rgba(180,195,215,0.8)',
                lineHeight: '1.8',
                fontStyle: 'italic',
              }}>
                🌧 今こそ内側を磨く時。この試練があなたを強くします。
              </div>
            )}
          </div>

          <button
            onClick={handleReset}
            style={{
              padding: '13px 44px',
              fontSize: '14px',
              fontFamily: 'inherit',
              letterSpacing: '0.3em',
              background: isKyo ? 'rgba(80,90,110,0.5)' : 'rgba(255,255,255,0.7)',
              color: isKyo ? 'rgba(200,210,230,0.9)' : currentFortune.textColor,
              border: `1.5px solid ${currentFortune.cardBorder}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'scale(1.02)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            もう一度引く
          </button>
        </div>
      )}
    </div>
  )
}
