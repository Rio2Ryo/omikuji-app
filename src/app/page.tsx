'use client'

import { useState, useEffect, useCallback } from 'react'

const K = {
  blue: '#1e5a9f',
  light: '#84acfc',
  bg: '#f8f7f6',
  dark: '#111827',
  text: '#333333',
  white: '#ffffff',
}

const LUCKY_ITEMS = [
  { category: 'カラー', items: ['ネイビー', 'ホワイト', 'グレー', 'ブラック', '濃紺', 'ゴールド', 'シルバー', 'ボルドー'] },
  { category: 'アクション', items: ['提案する', '連絡を入れる', '早起きする', 'メモを取る', '断捨離する', '挨拶を丁寧に', '先手を打つ', '確認する'] },
  { category: 'タイミング', items: ['午前中', '会議前', '昼休み', '夕方', '月曜日', '週末前', '月初め', '期末前'] },
  { category: 'キーワード', items: ['準備', '整理', '発信', '相談', '決断', '継続', '挑戦', '信頼'] },
  { category: '数字', items: ['1', '3', '7', '8', '11', '17', '21', '33'] },
  { category: 'パートナー', items: ['上司', '同僚', '部下', 'クライアント', '取引先', 'メンター', 'チーム全員', '自分自身'] },
]

const FORTUNES = [
  { id: 'daikichi', result: '大吉', reading: 'だいきち', resultColor: '#b8600a', bg: 'linear-gradient(145deg, #fff8ed 0%, #ffefc0 50%, #ffd878 100%)', cardBg: 'rgba(255,255,255,0.93)', cardBorder: '#f0c040', accent: '#d4820a', shimmer: 'shimmerGold', anim: 'scaleIn 0.45s cubic-bezier(0.34,1.8,0.64,1) forwards' },
  { id: 'kichi', result: '吉', reading: 'きち', resultColor: K.blue, bg: `linear-gradient(145deg, ${K.bg} 0%, #e8f0fb 100%)`, cardBg: 'rgba(255,255,255,0.93)', cardBorder: K.light, accent: K.blue, shimmer: 'shimmerBlue', anim: 'scaleIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards' },
  { id: 'chukichi', result: '中吉', reading: 'ちゅうきち', resultColor: '#2a7a40', bg: 'linear-gradient(145deg, #f0f8f2 0%, #d8f0e0 100%)', cardBg: 'rgba(255,255,255,0.93)', cardBorder: '#80c890', accent: '#2a7a40', shimmer: 'shimmerBlue', anim: 'scaleIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards' },
  { id: 'shokichi', result: '小吉', reading: 'しょうきち', resultColor: '#1a70a0', bg: 'linear-gradient(145deg, #f0f6fa 0%, #d8ecf8 100%)', cardBg: 'rgba(255,255,255,0.93)', cardBorder: '#70b8d8', accent: '#1a70a0', shimmer: 'shimmerBlue', anim: 'scaleIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards' },
  { id: 'suekichi', result: '末吉', reading: 'すえきち', resultColor: '#7040a0', bg: 'linear-gradient(145deg, #f6f2fc 0%, #ead8f4 100%)', cardBg: 'rgba(255,255,255,0.93)', cardBorder: '#b890d8', accent: '#7040a0', shimmer: 'shimmerBlue', anim: 'scaleIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards' },
  { id: 'kyo', result: '凶', reading: 'きょう', resultColor: '#707880', bg: `linear-gradient(145deg, ${K.dark} 0%, #1a2030 100%)`, cardBg: 'rgba(30,36,50,0.95)', cardBorder: '#3a4050', accent: '#8090a8', shimmer: 'shimmerGray', anim: 'sadDrop 0.6s cubic-bezier(0.22,1,0.36,1) forwards' },
]

function getLucky() {
  return LUCKY_ITEMS.map(c => ({ category: c.category, value: c.items[Math.floor(Math.random() * c.items.length)] }))
}

type Phase = 'shaking' | 'stick' | 'result'

// ── CSSアニメーション定義 ──────────────────────────
const CSS_ANIMATIONS = `
  @keyframes shakeBox {
    0%   { transform: rotate(0deg) translateX(0); }
    10%  { transform: rotate(-8deg) translateX(-6px); }
    20%  { transform: rotate(8deg) translateX(6px); }
    30%  { transform: rotate(-10deg) translateX(-8px); }
    40%  { transform: rotate(10deg) translateX(8px); }
    50%  { transform: rotate(-8deg) translateX(-6px); }
    60%  { transform: rotate(8deg) translateX(6px); }
    70%  { transform: rotate(-6deg) translateX(-4px); }
    80%  { transform: rotate(6deg) translateX(4px); }
    90%  { transform: rotate(-4deg) translateX(-2px); }
    100% { transform: rotate(0deg) translateX(0); }
  }
  @keyframes stickSlide {
    0%   { height: 0; opacity: 0; transform: translateY(-10px); }
    20%  { opacity: 1; }
    100% { height: 110px; opacity: 1; transform: translateY(0); }
  }
  @keyframes stickFadeNum {
    0%,60% { opacity: 0; }
    100%   { opacity: 1; }
  }
  @keyframes tiltBox {
    0%   { transform: rotate(0deg); }
    40%  { transform: rotate(30deg); }
    100% { transform: rotate(35deg); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.4) rotate(-6deg); }
    to   { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes sadDrop {
    from { opacity: 0; transform: translateY(-40px) scale(1); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes shimmerGold {
    0%,100% { text-shadow: 0 0 20px rgba(255,180,0,0.5); }
    50%     { text-shadow: 0 0 60px rgba(255,210,0,1), 0 0 100px rgba(255,140,0,0.6); }
  }
  @keyframes shimmerBlue {
    0%,100% { text-shadow: 0 0 12px rgba(132,172,252,0.4); }
    50%     { text-shadow: 0 0 35px rgba(132,172,252,0.9); }
  }
  @keyframes shimmerGray {
    0%,100% { text-shadow: 0 0 8px rgba(160,160,170,0.3); }
    50%     { text-shadow: 0 0 22px rgba(160,160,170,0.6); }
  }
  @keyframes logoGlow {
    0%,100% { opacity: 0.85; }
    50%     { opacity: 1; filter: drop-shadow(0 0 6px rgba(132,172,252,0.7)); }
  }
  @keyframes confettiFall {
    0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(110vh) rotate(540deg); opacity: 0.2; }
  }
  @keyframes rainFall {
    0%   { transform: translateY(-30px); opacity: 0; }
    15%  { opacity: 0.5; }
    100% { transform: translateY(110vh); opacity: 0; }
  }
  @keyframes sticksBounce {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-4px); }
  }
`

// おみくじ筒コンポーネント
function OmikujiBox({ shaking, tilting, stickNumber }: { shaking: boolean; tilting: boolean; stickNumber: number }) {
  const woodColor = '#c8a870'
  const woodDark = '#a07840'
  const goldBand = '#d4a830'

  return (
    <div style={{ position: 'relative', width: '120px', margin: '0 auto' }}>
      {/* 筒本体（六角形をシンプルに長方形で表現） */}
      <div style={{
        width: '80px',
        margin: '0 auto',
        position: 'relative',
        animation: shaking ? 'shakeBox 0.5s ease-in-out infinite' : tilting ? 'tiltBox 0.8s ease-out forwards' : 'none',
        transformOrigin: 'center bottom',
      }}>
        {/* 筒の上部（蓋） */}
        <div style={{
          width: '80px', height: '14px',
          background: `linear-gradient(135deg, ${woodColor} 0%, ${woodDark} 100%)`,
          borderRadius: '4px 4px 0 0',
          border: `1px solid ${woodDark}`,
          position: 'relative',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)',
        }}>
          {/* 穴 */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '12px', height: '12px',
            borderRadius: '50%',
            background: '#2a1a08',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)',
          }} />
        </div>

        {/* 筒の胴体 */}
        <div style={{
          width: '80px', height: '120px',
          background: `linear-gradient(135deg, ${woodColor} 0%, #b89050 50%, ${woodDark} 100%)`,
          border: `1px solid ${woodDark}`,
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 2px 0 6px rgba(255,255,255,0.2), inset -2px 0 6px rgba(0,0,0,0.15)',
        }}>
          {/* 木目 */}
          {[20, 50, 80].map(y => (
            <div key={y} style={{
              position: 'absolute', top: `${y}px`, left: 0, right: 0,
              height: '1px', background: 'rgba(100,60,20,0.2)',
            }} />
          ))}

          {/* 金帯 */}
          <div style={{
            position: 'absolute', top: '25px', left: 0, right: 0,
            height: '22px',
            background: `linear-gradient(180deg, ${goldBand}cc 0%, ${goldBand} 50%, ${goldBand}cc 100%)`,
            borderTop: `1px solid #f0c060`,
            borderBottom: `1px solid #a07820`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontSize: '11px', fontWeight: 'bold',
              color: '#5a3000', letterSpacing: '0.05em',
              fontFamily: "'Hiragino Mincho ProN', serif",
              writingMode: 'vertical-rl',
              lineHeight: 1,
            }}>御神籤</span>
          </div>

          {/* 内部の棒たち（シャカシャカ時に見える） */}
          {shaking && (
            <div style={{
              position: 'absolute', bottom: '0', left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex', gap: '3px',
              animation: 'sticksBounce 0.3s ease-in-out infinite',
            }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  width: '5px', height: `${50 + i * 8}px`,
                  background: '#e8d090',
                  borderRadius: '2px 2px 0 0',
                  opacity: 0.6 + i * 0.1,
                }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 棒が出てくる（傾けた後） */}
      {tilting && (
        <div style={{
          position: 'absolute',
          top: '-4px', left: '50%',
          transform: 'translateX(-50%) rotate(35deg)',
          transformOrigin: 'bottom center',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          overflow: 'hidden',
          animation: 'stickSlide 1.2s cubic-bezier(0.22,1,0.36,1) 0.3s forwards',
          height: 0,
        }}>
          <div style={{
            width: '10px',
            height: '110px',
            background: 'linear-gradient(180deg, #f0e0a0 0%, #d4b870 50%, #c0a060 100%)',
            borderRadius: '3px 3px 1px 1px',
            boxShadow: '1px 0 3px rgba(0,0,0,0.2)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: '10px', left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '9px', fontWeight: 'bold',
              color: '#5a3000',
              writingMode: 'vertical-rl',
              animation: 'stickFadeNum 1.5s ease forwards',
            }}>{stickNumber}</div>
          </div>
        </div>
      )}
    </div>
  )
}

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
          background: ['#FFD700', '#FF6347', '#FF69B4', '#84acfc', '#98FB98', '#FFA500', '#fff'][i % 7],
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
          top: '-30px', width: '1px',
          height: `${25 + Math.random() * 35}px`,
          background: 'linear-gradient(to bottom, transparent, rgba(132,172,252,0.35))',
          animation: `rainFall ${0.9 + Math.random() * 1.4}s linear ${i * 0.12}s infinite`,
        }} />
      ))}
    </div>
  )
}

function KataomoiLogo() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', animation: 'logoGlow 3s ease-in-out infinite' }}>
      <svg width="20" height="18" viewBox="0 0 24 22" fill="none">
        <path d="M12 20C12 20 1 13 1 7C1 4 3.5 2 6.5 2C8.5 2 10.3 3 11.5 4.5C12.7 3 14.5 2 16.5 2C19.5 2 22 4 22 7C22 13 12 20 12 20Z"
          fill="rgba(132,172,252,0.5)" style={{ filter: 'blur(3px)' }} />
        <path d="M12 19C12 19 2 12.5 2 7.5C2 4.7 4.2 2.5 7 2.5C8.8 2.5 10.4 3.4 11.5 4.8C12.6 3.4 14.2 2.5 16 2.5C18.8 2.5 21 4.7 21 7.5C21 12.5 12 19 12 19Z"
          fill="rgba(200,220,255,0.9)" />
      </svg>
      <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.2em', color: 'rgba(200,220,255,0.9)', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
        KATAOMOI
      </span>
    </div>
  )
}

export default function OmikujiApp() {
  const [phase, setPhase] = useState<Phase>('shaking')
  const [currentFortune, setCurrentFortune] = useState(() => FORTUNES[Math.floor(Math.random() * FORTUNES.length)])
  const [stickNumber] = useState(() => Math.floor(Math.random() * 50) + 1)
  const [luckyItems] = useState(getLucky)
  const [showEffects, setShowEffects] = useState(false)
  const [shaking, setShaking] = useState(true)
  const [tilting, setTilting] = useState(false)

  const isDaikichi = currentFortune.id === 'daikichi'
  const isKyo = currentFortune.id === 'kyo'

  useEffect(() => {
    if (phase === 'shaking') {
      setShaking(true)
      setTilting(false)
      // 2秒シャカシャカ → 傾ける
      const t1 = setTimeout(() => {
        setShaking(false)
        setTilting(true)
        setPhase('stick')
      }, 3500)
      return () => clearTimeout(t1)
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'stick') {
      // 棒が出たら1.8秒後に結果
      const t = setTimeout(() => {
        setPhase('result')
        setTilting(false)
        setTimeout(() => setShowEffects(true), 400)
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [phase])

  const handleReset = useCallback(() => {
    setShowEffects(false)
    setShaking(false)
    setTilting(false)
    setCurrentFortune(FORTUNES[Math.floor(Math.random() * FORTUNES.length)])
    setPhase('shaking')
  }, [])

  return (
    <>
      <style>{CSS_ANIMATIONS}</style>
      <div style={{
        minHeight: '100vh',
        background: phase === 'result' ? currentFortune.bg : `linear-gradient(145deg, ${K.bg} 0%, #e4edf8 100%)`,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', transition: 'background 0.7s ease',
      }}>
        {phase === 'result' && showEffects && isDaikichi && <StarBurst />}
        {phase === 'result' && showEffects && isKyo && <RainEffect />}

        {/* ヘッダー */}
        <header style={{
          width: '100%', padding: '13px 20px',
          background: K.dark,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 20,
          boxShadow: '0 1px 0 rgba(132,172,252,0.15)',
        }}>
          <KataomoiLogo />
          <span style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.2em', color: 'rgba(200,215,240,0.6)', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
            おみくじ
          </span>
        </header>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>

          {/* シャカシャカ & 棒が出るシーン */}
          {(phase === 'shaking' || phase === 'stick') && (
            <div style={{ textAlign: 'center', animation: 'fadeInUp 0.4s ease forwards' }}>
              {/* 神社背景風の装飾 */}
              <div style={{
                width: 'min(300px, 88vw)',
                margin: '0 auto',
                background: 'linear-gradient(180deg, #fdf6e8 0%, #f5e8c8 100%)',
                borderRadius: '20px',
                padding: '40px 20px 50px',
                boxShadow: `0 8px 40px rgba(30,90,159,0.12), 0 2px 8px rgba(0,0,0,0.08)`,
                border: `1px solid ${K.light}40`,
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* 背景の鳥居シルエット */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
                  background: 'linear-gradient(180deg, transparent 0%, rgba(180,120,60,0.08) 100%)',
                  pointerEvents: 'none',
                }} />
                {/* 紙垂（しめ縄風装飾） */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '6px',
                  background: `repeating-linear-gradient(90deg, #e8c860 0px, #e8c860 20px, transparent 20px, transparent 30px)`,
                  opacity: 0.5,
                }} />

                <OmikujiBox shaking={shaking} tilting={tilting} stickNumber={stickNumber} />

                <p style={{
                  marginTop: '24px', fontSize: '13px',
                  color: '#8a6040', letterSpacing: '0.25em', opacity: 0.8,
                }}>
                  {phase === 'shaking' ? 'シャカシャカ…' : `第 ${stickNumber} 番`}
                </p>
              </div>
            </div>
          )}

          {/* RESULT */}
          {phase === 'result' && (
            <div style={{ animation: 'fadeInUp 0.5s ease forwards', width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>
              <p style={{
                textAlign: 'center', fontSize: '11px', fontWeight: '600',
                letterSpacing: '0.3em', marginBottom: '6px',
                color: isKyo ? 'rgba(180,195,215,0.5)' : `${currentFortune.accent}88`,
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
              }}>NO. {stickNumber}</p>

              <div style={{
                textAlign: 'center',
                fontSize: 'clamp(80px, 24vw, 120px)',
                fontWeight: '900',
                color: currentFortune.resultColor,
                animation: `${currentFortune.anim}, ${currentFortune.shimmer} 2.5s ease-in-out 0.5s infinite`,
                lineHeight: 1, marginBottom: '4px',
                fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif",
              }}>{currentFortune.result}</div>

              <p style={{
                textAlign: 'center', fontSize: '12px', letterSpacing: '0.35em', marginBottom: '20px',
                color: isKyo ? 'rgba(180,195,215,0.45)' : `${currentFortune.accent}80`,
              }}>{currentFortune.reading}</p>

              <div style={{
                background: currentFortune.cardBg,
                border: `1px solid ${currentFortune.cardBorder}`,
                borderRadius: '12px', padding: '18px', marginBottom: '14px',
                backdropFilter: 'blur(16px)',
                boxShadow: isDaikichi ? '0 4px 24px rgba(255,180,0,0.12)' : isKyo ? '0 4px 24px rgba(0,0,0,0.5)' : '0 4px 16px rgba(30,90,159,0.07)',
              }}>
                {!isKyo ? (
                  <>
                    <div style={{
                      textAlign: 'center', fontSize: '10px', fontWeight: '700',
                      letterSpacing: '0.4em', marginBottom: '12px',
                      color: `${currentFortune.accent}99`,
                      fontFamily: "'Helvetica Neue', Arial, sans-serif",
                    }}>TODAY&apos;S LUCKY</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      {luckyItems.map(item => (
                        <div key={item.category} style={{
                          background: isDaikichi ? 'rgba(255,200,0,0.07)' : `${currentFortune.accent}0d`,
                          borderRadius: '8px', padding: '10px 6px', textAlign: 'center',
                          border: `1px solid ${currentFortune.cardBorder}50`,
                        }}>
                          <div style={{ fontSize: '9px', color: `${currentFortune.accent}75`, marginBottom: '5px', fontWeight: '600', letterSpacing: '0.05em', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>{item.category}</div>
                          <div style={{ fontSize: '13px', color: currentFortune.resultColor, fontWeight: '700', fontFamily: "'Hiragino Sans', sans-serif" }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.4em', color: 'rgba(160,175,200,0.55)', marginBottom: '14px', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>TODAY&apos;S MESSAGE</div>
                    <p style={{ fontSize: '14px', color: 'rgba(190,200,215,0.85)', lineHeight: '1.9' }}>
                      今は耐える時。慎重に行動することで、<br />必ず光が差し込んできます。
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleReset}
                style={{
                  display: 'block', width: '100%', padding: '14px',
                  fontSize: '14px', fontWeight: '600',
                  fontFamily: "'Hiragino Sans', sans-serif",
                  letterSpacing: '0.2em',
                  background: isKyo ? 'rgba(50,60,80,0.8)' : K.blue,
                  color: K.white, border: 'none', borderRadius: '8px',
                  cursor: 'pointer', transition: 'all 0.2s',
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
    </>
  )
}
