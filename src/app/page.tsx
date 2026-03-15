'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// KATAOMOIブランドカラー
const K = {
  blue: '#1e5a9f',
  light: '#84acfc',
  bg: '#f8f7f6',
  dark: '#111827',
  text: '#333333',
  white: '#ffffff',
}

const LUCKY_ITEMS = [
  { category: 'カラー', items: ['金色', '白', '赤', '紺', '紫', '緑', '桃色', '橙', '水色', '黄色'] },
  { category: 'アイテム', items: ['桜の花びら', '招き猫', '四つ葉', '富士山', '鶴', '亀', '梅の花', '打ち出の小槌', '宝船', '松の葉'] },
  { category: 'フード', items: ['赤飯', '鯛', '饅頭', '栗', 'みかん', '柚子', '昆布', '梅干し', 'お餅', '甘酒'] },
  { category: '方角', items: ['北', '南', '東', '西', '北東', '南西', '北西', '南東'] },
  { category: 'タイム', items: ['朝', '昼', '夕方', '夜', '夜明け', '日没時'] },
  { category: '数字', items: ['1', '3', '5', '7', '8', '11', '15', '21', '33', '88'] },
]

const FORTUNES = [
  {
    id: 'daikichi',
    result: '大吉',
    reading: 'だいきち',
    resultColor: '#b8600a',
    bg: `linear-gradient(145deg, #fff8ed 0%, #ffefc0 50%, #ffd878 100%)`,
    headerBg: K.dark,
    cardBg: 'rgba(255,255,255,0.92)',
    cardBorder: '#f0c040',
    accent: '#d4820a',
    shimmer: 'shimmerGold',
    anim: 'scaleIn 0.45s cubic-bezier(0.34,1.8,0.64,1) forwards',
    message: '最高の運気です。天の恵みがあなたに降り注いでいます。何事も恐れず、大きく踏み出しましょう。',
  },
  {
    id: 'kichi',
    result: '吉',
    reading: 'きち',
    resultColor: K.blue,
    bg: `linear-gradient(145deg, ${K.bg} 0%, #e8f0fb 100%)`,
    headerBg: K.dark,
    cardBg: 'rgba(255,255,255,0.92)',
    cardBorder: K.light,
    accent: K.blue,
    shimmer: 'shimmerBlue',
    anim: 'scaleIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
    message: '良い運気が流れています。積極的に行動することで、さらなる幸運を引き寄せられます。',
  },
  {
    id: 'chukichi',
    result: '中吉',
    reading: 'ちゅうきち',
    resultColor: '#2a7a40',
    bg: 'linear-gradient(145deg, #f0f8f2 0%, #d8f0e0 100%)',
    headerBg: K.dark,
    cardBg: 'rgba(255,255,255,0.92)',
    cardBorder: '#80c890',
    accent: '#2a7a40',
    shimmer: 'shimmerBlue',
    anim: 'scaleIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
    message: '穏やかな運気。焦らず着実に一歩一歩進むことが開運の鍵です。',
  },
  {
    id: 'shokichi',
    result: '小吉',
    reading: 'しょうきち',
    resultColor: '#1a70a0',
    bg: `linear-gradient(145deg, #f0f6fa 0%, #d8ecf8 100%)`,
    headerBg: K.dark,
    cardBg: 'rgba(255,255,255,0.92)',
    cardBorder: '#70b8d8',
    accent: '#1a70a0',
    shimmer: 'shimmerBlue',
    anim: 'scaleIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
    message: '小さな幸運が積み重なります。日々の丁寧な行いが運勢を高めていきます。',
  },
  {
    id: 'suekichi',
    result: '末吉',
    reading: 'すえきち',
    resultColor: '#7040a0',
    bg: 'linear-gradient(145deg, #f6f2fc 0%, #ead8f4 100%)',
    headerBg: K.dark,
    cardBg: 'rgba(255,255,255,0.92)',
    cardBorder: '#b890d8',
    accent: '#7040a0',
    shimmer: 'shimmerBlue',
    anim: 'scaleIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
    message: '今は種まきの時。焦らずに準備を重ねれば、必ず花開く日が来ます。',
  },
  {
    id: 'kyo',
    result: '凶',
    reading: 'きょう',
    resultColor: '#707880',
    bg: `linear-gradient(145deg, ${K.dark} 0%, #1a2030 100%)`,
    headerBg: '#0a0f18',
    cardBg: 'rgba(30,36,50,0.95)',
    cardBorder: '#3a4050',
    accent: '#8090a8',
    shimmer: 'shimmerGray',
    anim: 'sadDrop 0.6s cubic-bezier(0.22,1,0.36,1) forwards',
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
      {Array.from({ length: 50 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${5 + Math.random() * 90}%`,
          top: '-15px',
          width: `${5 + Math.random() * 9}px`,
          height: `${9 + Math.random() * 13}px`,
          background: ['#FFD700','#FF6347','#FF69B4','#84acfc','#98FB98','#FFA500','#fff'][i % 7],
          borderRadius: '2px',
          animation: `confettiFall ${1.4 + Math.random() * 2.6}s ease-in ${i * 0.05}s forwards`,
        }} />
      ))}
    </div>
  )
}

function RainEffect() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      {Array.from({ length: 30 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: '-30px',
          width: '1px',
          height: `${25 + Math.random() * 35}px`,
          background: 'linear-gradient(to bottom, transparent, rgba(132,172,252,0.35))',
          animation: `rainFall ${0.9 + Math.random() * 1.4}s linear ${i * 0.12}s infinite`,
        }} />
      ))}
    </div>
  )
}

// KATAOMOIロゴSVG（ぼわっとした青いハートマーク風）
function KataomoiLogo({ dark = false }: { dark?: boolean }) {
  const color = dark ? 'rgba(200,220,255,0.9)' : K.blue
  const glowColor = dark ? 'rgba(132,172,252,0.8)' : 'rgba(30,90,159,0.5)'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '7px',
      animation: 'logoGlow 3s ease-in-out infinite',
    }}>
      <svg width="20" height="18" viewBox="0 0 24 22" fill="none">
        {/* ぼわっとしたグロー */}
        <path d="M12 20C12 20 1 13 1 7C1 4 3.5 2 6.5 2C8.5 2 10.3 3 11.5 4.5C12.7 3 14.5 2 16.5 2C19.5 2 22 4 22 7C22 13 12 20 12 20Z"
          fill={glowColor} style={{ filter: 'blur(3px)' }} opacity="0.6" />
        {/* メインハート */}
        <path d="M12 19C12 19 2 12.5 2 7.5C2 4.7 4.2 2.5 7 2.5C8.8 2.5 10.4 3.4 11.5 4.8C12.6 3.4 14.2 2.5 16 2.5C18.8 2.5 21 4.7 21 7.5C21 12.5 12 19 12 19Z"
          fill={color} />
      </svg>
      <span style={{
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.2em',
        color: color,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}>KATAOMOI</span>
    </div>
  )
}

export default function OmikujiApp() {
  const [phase, setPhase] = useState<Phase>('shaking')
  const [currentFortune, setCurrentFortune] = useState(
    () => FORTUNES[Math.floor(Math.random() * FORTUNES.length)]
  )
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
        setTimeout(() => setShowEffects(true), 400)
        voiceResultRef.current?.play().catch(() => {})
      }, 3500)
      return () => clearTimeout(t)
    }
  }, [phase])

  const handleReset = useCallback(() => {
    setShowEffects(false)
    setCurrentFortune(FORTUNES[Math.floor(Math.random() * FORTUNES.length)])
    setPhase('shaking')
  }, [])

  const isAnimating = phase !== 'result'

  return (
    <div style={{
      minHeight: '100vh',
      background: phase === 'result' ? currentFortune.bg : `linear-gradient(145deg, ${K.bg} 0%, #e4edf8 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      transition: 'background 0.7s ease',
    }}>
      {phase === 'result' && showEffects && isDaikichi && <StarBurst />}
      {phase === 'result' && showEffects && isKyo && <RainEffect />}

      <audio ref={voiceShakingRef} src="/audio/voice_shaking.mp3" />
      <audio ref={voiceStickRef} src="/audio/voice_stick.mp3" />
      <audio ref={voiceResultRef} src="/audio/voice_result.mp3" />

      {/* ヘッダー */}
      <header style={{
        width: '100%',
        padding: '14px 20px',
        background: phase === 'result' ? currentFortune.headerBg : K.dark,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'background 0.7s ease',
        position: 'sticky', top: 0, zIndex: 20,
        boxShadow: '0 1px 0 rgba(132,172,252,0.2)',
      }}>
        <KataomoiLogo dark />
        <span style={{
          fontSize: '12px',
          fontWeight: '600',
          letterSpacing: '0.2em',
          color: 'rgba(200,215,240,0.7)',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
        }}>おみくじ</span>
      </header>

      {/* メインコンテンツ */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '24px 20px',
      }}>

        {/* SHAKING */}
        {phase === 'shaking' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease forwards', width: '100%', maxWidth: '360px' }}>
            <div style={{
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: `0 8px 40px rgba(30,90,159,0.15), 0 2px 8px rgba(0,0,0,0.1)`,
              border: `1px solid ${K.light}50`,
              background: K.white,
            }}>
              <video ref={shakeVideoRef} src="/videos/shake_v1.mp4" muted playsInline style={{ width: '100%', display: 'block' }} />
            </div>
            <p style={{ marginTop: '16px', fontSize: '13px', color: K.blue, letterSpacing: '0.25em', opacity: 0.8 }}>
              振っています…
            </p>
          </div>
        )}

        {/* STICK */}
        {phase === 'stick' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease forwards', width: '100%', maxWidth: '360px' }}>
            <div style={{
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: `0 8px 40px rgba(30,90,159,0.15), 0 2px 8px rgba(0,0,0,0.1)`,
              border: `1px solid ${K.light}50`,
              background: K.white,
            }}>
              <video ref={stickVideoRef} src="/videos/stick_out_v2.mp4" muted playsInline style={{ width: '100%', display: 'block' }} />
            </div>
            <p style={{
              marginTop: '16px',
              fontSize: '20px',
              fontWeight: '700',
              color: K.blue,
              letterSpacing: '0.15em',
            }}>
              第 {stickNumber} 番
            </p>
          </div>
        )}

        {/* RESULT */}
        {phase === 'result' && (
          <div style={{
            animation: 'fadeIn 0.5s ease forwards',
            width: '100%',
            maxWidth: '400px',
            position: 'relative',
            zIndex: 1,
          }}>
            {/* 番号 */}
            <p style={{
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.3em',
              color: isKyo ? 'rgba(180,195,215,0.55)' : `${currentFortune.accent}99`,
              marginBottom: '6px',
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
            }}>NO. {stickNumber}</p>

            {/* 運勢 */}
            <div style={{
              textAlign: 'center',
              fontSize: 'clamp(80px, 24vw, 120px)',
              fontWeight: '900',
              color: currentFortune.resultColor,
              animation: `${currentFortune.anim}, ${currentFortune.shimmer} 2.5s ease-in-out 0.5s infinite`,
              lineHeight: 1,
              marginBottom: '6px',
              fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif",
            }}>
              {currentFortune.result}
            </div>
            <p style={{
              textAlign: 'center',
              fontSize: '12px',
              letterSpacing: '0.35em',
              color: isKyo ? 'rgba(180,195,215,0.5)' : `${currentFortune.accent}88`,
              marginBottom: '22px',
            }}>{currentFortune.reading}</p>

            {/* カード */}
            <div style={{
              background: currentFortune.cardBg,
              border: `1px solid ${currentFortune.cardBorder}`,
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
              backdropFilter: 'blur(16px)',
              boxShadow: isDaikichi
                ? '0 4px 24px rgba(255,180,0,0.15), 0 1px 3px rgba(0,0,0,0.08)'
                : isKyo
                ? '0 4px 24px rgba(0,0,0,0.5)'
                : '0 4px 20px rgba(30,90,159,0.08), 0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <p style={{
                fontSize: '14px',
                lineHeight: '1.85',
                color: isKyo ? 'rgba(200,210,225,0.85)' : K.text,
                marginBottom: '18px',
                textAlign: 'center',
              }}>
                {currentFortune.message}
              </p>

              {/* ラッキーアイテム */}
              {!isKyo ? (
                <>
                  <div style={{
                    borderTop: `1px solid ${currentFortune.cardBorder}80`,
                    paddingTop: '14px',
                    marginBottom: '12px',
                    textAlign: 'center',
                    fontSize: '10px',
                    fontWeight: '700',
                    letterSpacing: '0.4em',
                    color: `${currentFortune.accent}99`,
                    fontFamily: "'Helvetica Neue', Arial, sans-serif",
                  }}>LUCKY</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {luckyItems.map(item => (
                      <div key={item.category} style={{
                        background: isDaikichi ? 'rgba(255,200,0,0.08)' : `${currentFortune.accent}0d`,
                        borderRadius: '8px',
                        padding: '9px 6px',
                        textAlign: 'center',
                        border: `1px solid ${currentFortune.cardBorder}60`,
                      }}>
                        <div style={{
                          fontSize: '9px',
                          color: `${currentFortune.accent}80`,
                          marginBottom: '5px',
                          fontWeight: '600',
                          letterSpacing: '0.05em',
                          fontFamily: "'Helvetica Neue', Arial, sans-serif",
                        }}>{item.category.toUpperCase()}</div>
                        <div style={{
                          fontSize: '13px',
                          color: currentFortune.resultColor,
                          fontWeight: '700',
                          fontFamily: "'Hiragino Sans', sans-serif",
                        }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{
                  borderTop: '1px solid rgba(100,120,150,0.3)',
                  paddingTop: '14px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'rgba(180,195,215,0.75)',
                  lineHeight: '1.8',
                }}>
                  ── 今こそ内側を磨く時。<br />この試練があなたを強くします。
                </div>
              )}
            </div>

            {/* もう一度ボタン */}
            <button
              onClick={handleReset}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: "'Hiragino Sans', sans-serif",
                letterSpacing: '0.2em',
                background: isKyo ? 'rgba(50,60,80,0.8)' : K.blue,
                color: K.white,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isKyo ? 'none' : `0 4px 16px ${K.blue}40`,
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              もう一度引く
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
