'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

const LUCKY_ITEMS = [
  { category: 'カラー', items: ['金色', '白', '赤', '紺', '紫', '緑', '桃色', '橙', '水色', '黄色'] },
  { category: 'アイテム', items: ['桜の花びら', '招き猫', '四つ葉', '富士山', '鶴', '亀', '梅の花', '打ち出の小槌', '宝船', '松の葉'] },
  { category: '食べ物', items: ['赤飯', '鯛', '饅頭', '栗', 'みかん', '柚子', '昆布', '梅干し', 'お餅', '甘酒'] },
  { category: '方角', items: ['北', '南', '東', '西', '北東', '南西', '北西', '南東'] },
  { category: '時間帯', items: ['朝', '昼', '夕方', '夜', '夜明け', '日没時'] },
]

const FORTUNES = [
  {
    id: 'daikichi',
    result: '大吉',
    reading: 'だいきち',
    color: '#FFD700',
    glow: 'rgba(255,215,0,0.9)',
    bgClass: 'bg-daikichi',
    shimmerClass: 'shimmerGold',
    message: '最高の運気！天の恵みがあなたに降り注いでいます。何事も恐れず、大きく踏み出しましょう。',
    detail: { 願望: '必ず叶う', 恋愛: '最高の出会い', 仕事: '大きな飛躍', 健康: '非常に良好' },
  },
  {
    id: 'kichi',
    result: '吉',
    reading: 'きち',
    color: '#FF8C00',
    glow: 'rgba(255,140,0,0.8)',
    bgClass: 'bg-normal',
    shimmerClass: 'shimmerBlue',
    message: '良い運気が流れています。積極的に行動することで、さらなる幸運を引き寄せられます。',
    detail: { 願望: '叶う', 恋愛: '良縁あり', 仕事: '順調に進む', 健康: '良好' },
  },
  {
    id: 'chukichi',
    result: '中吉',
    reading: 'ちゅうきち',
    color: '#90EE90',
    glow: 'rgba(144,238,144,0.8)',
    bgClass: 'bg-normal',
    shimmerClass: 'shimmerBlue',
    message: '穏やかな運気。焦らず着実に一歩一歩進むことが開運の鍵です。',
    detail: { 願望: 'やや叶う', 恋愛: '発展の兆し', 仕事: '堅実に進む', 健康: 'まずまず' },
  },
  {
    id: 'shokichi',
    result: '小吉',
    reading: 'しょうきち',
    color: '#87CEEB',
    glow: 'rgba(135,206,235,0.8)',
    bgClass: 'bg-normal',
    shimmerClass: 'shimmerBlue',
    message: '小さな幸運が積み重なります。日々の丁寧な行いが運勢を高めていきます。',
    detail: { 願望: '少し叶う', 恋愛: 'ゆっくり育む', 仕事: '地道に努力', 健康: '無理は禁物' },
  },
  {
    id: 'suekichi',
    result: '末吉',
    reading: 'すえきち',
    color: '#DDA0DD',
    glow: 'rgba(221,160,221,0.8)',
    bgClass: 'bg-normal',
    shimmerClass: 'shimmerBlue',
    message: '今は種まきの時。焦らずに準備を重ねれば、必ず花開く日が来ます。',
    detail: { 願望: '待てば叶う', 恋愛: '焦らないで', 仕事: '準備期間', 健康: '養生が大切' },
  },
  {
    id: 'kyo',
    result: '凶',
    reading: 'きょう',
    color: '#8899aa',
    glow: 'rgba(136,153,170,0.5)',
    bgClass: 'bg-kyo',
    shimmerClass: 'shimmerGray',
    message: '嵐の前の静けさ。今は耐える時。慎重に行動することで、必ず光が差し込んできます。',
    detail: { 願望: '今は難しい', 恋愛: '慎重に', 仕事: '焦らず見直し', 健康: '注意が必要' },
  },
]

function getLuckyItems() {
  return LUCKY_ITEMS.map(cat => ({
    category: cat.category,
    value: cat.items[Math.floor(Math.random() * cat.items.length)],
  }))
}

type Phase = 'shaking' | 'stick' | 'result'

// 大吉用：金色の星バースト
function StarBurst({ color }: { color: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {Array.from({ length: 30 }, (_, i) => {
        const angle = (i / 30) * 360
        const dist = 80 + Math.random() * 200
        const size = 6 + Math.random() * 14
        return (
          <div key={i} style={{
            position: 'absolute',
            left: '50%', top: '40%',
            width: `${size}px`, height: `${size}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            background: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#FFA500' : '#fff',
            animation: `starBurst 1.8s ease-out ${i * 0.04}s forwards`,
            '--rot': `${angle}deg`,
            transform: `rotate(${angle}deg) translateX(${dist}px)`,
            boxShadow: `0 0 ${size}px ${color}`,
          } as React.CSSProperties} />
        )
      })}
      {/* 紙吹雪 */}
      {Array.from({ length: 40 }, (_, i) => (
        <div key={`c${i}`} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: '-10px',
          width: `${4 + Math.random() * 8}px`,
          height: `${8 + Math.random() * 12}px`,
          background: ['#FFD700','#FF6347','#FF69B4','#87CEEB','#98FB98'][i % 5],
          borderRadius: '2px',
          animation: `rainDrop ${1 + Math.random() * 2}s linear ${i * 0.06}s forwards`,
        }} />
      ))}
    </div>
  )
}

// 凶用：雨粒エフェクト
function RainEffect() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {Array.from({ length: 30 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: '-20px',
          width: '1.5px',
          height: `${20 + Math.random() * 30}px`,
          background: 'linear-gradient(to bottom, transparent, rgba(100,130,160,0.5))',
          animation: `rainDrop ${0.8 + Math.random() * 1.2}s linear ${i * 0.12}s infinite`,
        }} />
      ))}
    </div>
  )
}

export default function OmikujiApp() {
  const [phase, setPhase] = useState<Phase>('shaking')
  const [fortune, setFortune] = useState<(typeof FORTUNES)[0]>(() => FORTUNES[Math.floor(Math.random() * FORTUNES.length)])
  const [stickNumber] = useState(() => Math.floor(Math.random() * 50) + 1)
  const [luckyItems] = useState(getLuckyItems)
  const [showEffects, setShowEffects] = useState(false)
  const shakeVideoRef = useRef<HTMLVideoElement>(null)
  const stickVideoRef = useRef<HTMLVideoElement>(null)
  const voiceShakingRef = useRef<HTMLAudioElement>(null)
  const voiceStickRef = useRef<HTMLAudioElement>(null)
  const voiceResultRef = useRef<HTMLAudioElement>(null)

  const isDaikichi = fortune.id === 'daikichi'
  const isKyo = fortune.id === 'kyo'

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
    setFortune(FORTUNES[Math.floor(Math.random() * FORTUNES.length)])
    setPhase('shaking')
  }, [])

  const bgClass = phase === 'result' ? fortune.bgClass : 'bg-normal'

  return (
    <div className={bgClass} style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      transition: 'background 1s ease',
    }}>

      {/* 通常時の背景装飾 */}
      {!isDaikichi && !isKyo && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(100,160,255,0.06) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          pointerEvents: 'none',
        }} />
      )}

      {/* エフェクト */}
      {phase === 'result' && showEffects && isDaikichi && <StarBurst color={fortune.color} />}
      {phase === 'result' && showEffects && isKyo && <RainEffect />}

      {/* Audio */}
      <audio ref={voiceShakingRef} src="/audio/voice_shaking.mp3" />
      <audio ref={voiceStickRef} src="/audio/voice_stick.mp3" />
      <audio ref={voiceResultRef} src="/audio/voice_result.mp3" />

      {/* ロゴヘッダー（片思い風：青くぼわっと） */}
      <div style={{
        position: 'absolute', top: '18px', left: 0, right: 0,
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          animation: 'logoGlow 3s ease-in-out infinite',
        }}>
          {/* ロゴアイコン：ぼわっとした青いハート */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.09C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14 14 21 12 21Z"
              fill="rgba(100,160,255,0.7)"
              style={{ filter: 'blur(1px)' }}
            />
            <path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.09C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14 14 21 12 21Z"
              fill="none" stroke="rgba(160,200,255,0.9)" strokeWidth="1"
            />
          </svg>
          <span style={{
            fontSize: '11px',
            letterSpacing: '0.35em',
            color: 'rgba(160,210,255,0.85)',
            fontWeight: '500',
          }}>KATAOMOI INC.</span>
        </div>
        <div style={{
          fontSize: 'clamp(18px, 4vw, 26px)',
          fontWeight: 'bold',
          letterSpacing: '0.3em',
          background: 'linear-gradient(180deg, #a0d4ff 0%, #4a90e2 60%, #2060b0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 8px rgba(100,160,255,0.6))',
          marginTop: '2px',
        }}>おみくじ</div>
      </div>

      {/* SHAKING */}
      {phase === 'shaking' && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease forwards', paddingTop: '60px' }}>
          <div style={{
            width: 'min(300px, 86vw)',
            margin: '0 auto',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(100,160,255,0.2), 0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <video ref={shakeVideoRef} src="/videos/shake_v1.mp4" muted playsInline style={{ width: '100%', display: 'block' }} />
          </div>
          <div style={{ marginTop: '16px', fontSize: '13px', color: 'rgba(160,210,255,0.7)', letterSpacing: '0.3em' }}>
            ✦ シャカシャカ… ✦
          </div>
        </div>
      )}

      {/* STICK */}
      {phase === 'stick' && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease forwards', paddingTop: '60px' }}>
          <div style={{
            width: 'min(300px, 86vw)',
            margin: '0 auto',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(100,160,255,0.2), 0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <video ref={stickVideoRef} src="/videos/stick_out_v2.mp4" muted playsInline style={{ width: '100%', display: 'block' }} />
          </div>
          <div style={{
            marginTop: '16px', fontSize: '22px', fontWeight: 'bold',
            color: 'rgba(200,230,255,0.9)', letterSpacing: '0.2em',
            filter: 'drop-shadow(0 0 8px rgba(100,160,255,0.5))',
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
          padding: '70px 20px 20px',
          width: '100%',
          maxWidth: '440px',
        }}>
          <div style={{
            fontSize: '11px',
            color: isKyo ? 'rgba(150,170,190,0.6)' : 'rgba(160,210,255,0.7)',
            letterSpacing: '0.3em',
            marginBottom: '4px',
          }}>第 {stickNumber} 番</div>

          {/* 運勢テキスト */}
          <div style={{
            fontSize: 'clamp(56px, 18vw, 88px)',
            fontWeight: 'bold',
            letterSpacing: '0.08em',
            color: fortune.color,
            animation: isKyo
              ? 'sadDrop 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards, shimmerGray 3s ease-in-out 1s infinite'
              : isDaikichi
              ? 'scaleIn 0.5s cubic-bezier(0.34, 1.8, 0.64, 1) forwards, shimmerGold 1.5s ease-in-out 0.5s infinite'
              : 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, shimmerBlue 2s ease-in-out 0.5s infinite',
            lineHeight: 1,
            marginBottom: '4px',
          }}>
            {fortune.result}
          </div>
          <div style={{
            fontSize: '12px',
            letterSpacing: '0.3em',
            marginBottom: '16px',
            color: isKyo ? 'rgba(130,150,170,0.6)' : 'rgba(160,210,255,0.6)',
          }}>{fortune.reading}</div>

          {/* メッセージカード */}
          <div style={{
            background: isKyo
              ? 'rgba(20,25,35,0.7)'
              : isDaikichi
              ? 'rgba(255,200,0,0.06)'
              : 'rgba(100,160,255,0.05)',
            border: `1px solid ${fortune.color}35`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '14px',
            backdropFilter: 'blur(8px)',
          }}>
            <p style={{
              fontSize: '13px',
              lineHeight: '1.9',
              color: isKyo ? 'rgba(180,190,200,0.8)' : 'rgba(220,240,255,0.9)',
              marginBottom: '14px',
            }}>
              {isKyo && <span style={{ marginRight: '6px' }}>…</span>}
              {fortune.message}
            </p>

            {/* ラッキーアイテム（凶のときは非表示） */}
            {!isKyo && (
              <div style={{ borderTop: `1px solid ${fortune.color}25`, paddingTop: '12px' }}>
                <div style={{ fontSize: '10px', color: 'rgba(160,210,255,0.6)', letterSpacing: '0.3em', marginBottom: '10px' }}>
                  ✦ ラッキー ✦
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                  {luckyItems.map(item => (
                    <div key={item.category} style={{
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '6px',
                      padding: '7px 9px',
                      borderBottom: `2px solid ${fortune.color}50`,
                    }}>
                      <div style={{ fontSize: '9px', color: 'rgba(140,170,200,0.6)', marginBottom: '2px' }}>{item.category}</div>
                      <div style={{ fontSize: '12px', color: fortune.color, fontWeight: 'bold' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 凶のときだけ励ましメッセージ */}
            {isKyo && (
              <div style={{
                borderTop: '1px solid rgba(100,120,140,0.3)',
                paddingTop: '12px',
                fontSize: '12px',
                color: 'rgba(150,170,190,0.7)',
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
              padding: '12px 40px',
              fontSize: '14px',
              fontFamily: 'inherit',
              letterSpacing: '0.3em',
              background: 'transparent',
              color: isKyo ? 'rgba(150,170,190,0.7)' : 'rgba(160,210,255,0.8)',
              border: `1px solid ${isKyo ? 'rgba(100,120,140,0.4)' : 'rgba(100,160,255,0.3)'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.25s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = isKyo ? 'rgba(80,90,100,0.2)' : 'rgba(100,160,255,0.1)'
              e.currentTarget.style.borderColor = isKyo ? 'rgba(130,150,170,0.6)' : 'rgba(100,160,255,0.6)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = isKyo ? 'rgba(100,120,140,0.4)' : 'rgba(100,160,255,0.3)'
            }}
          >
            もう一度引く
          </button>
        </div>
      )}
    </div>
  )
}
