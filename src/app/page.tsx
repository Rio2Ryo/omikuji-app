'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// KATAOMOI ブランドカラー
const K = {
  navy: '#0f1f3d',
  blue: '#1e5a9f',
  light: '#84acfc',
  pale: '#e8f0fb',
  bg: '#f5f7fa',
  white: '#ffffff',
  text: '#1a2a3a',
}

// ラッキーアイテム：実際の「モノ・場所・生き物」
const LUCKY_ITEMS = [
  '🌸 桜の花びら', '🐱 黒猫', '🍀 四つ葉のクローバー', '🌙 三日月',
  '🦋 蝶', '🌊 波の音', '🍋 レモン', '🦔 ハリネズミ',
  '📚 古い本', '☕ コーヒー', '🌿 ミント', '🦉 フクロウ',
  '🌈 虹', '🍄 きのこ', '⭐ 流れ星', '🐢 亀',
  '🎋 竹', '🌺 ハイビスカス', '🦊 キツネ', '💎 青い石',
  '🌻 ひまわり', '🐬 イルカ', '🍵 お茶', '🌙 満月',
  '🦅 鷹', '🌵 サボテン', '🍇 ぶどう', '🐝 みつばち',
  '🌟 金色の光', '🎐 風鈴', '🍁 紅葉', '🐋 クジラ',
]

const FORTUNES = [
  {
    id: 'daikichi', result: '大吉', reading: 'だいきち',
    message: '天が味方している日。あなたの直感は今日、驚くほど正確です。躊躇わず動いてください。扉は、あなたが手を伸ばした瞬間に開きます。',
    resultColor: '#c07010',
    bg: 'linear-gradient(150deg, #fffbf0 0%, #fff3c0 40%, #ffe080 100%)',
    cardBg: 'rgba(255,255,255,0.92)', cardBorder: '#e8c030',
    accent: '#b86800', shimmer: 'shimmerGold',
    anim: 'scaleIn 0.5s cubic-bezier(0.34,1.8,0.64,1) forwards',
  },
  {
    id: 'kichi', result: '吉', reading: 'きち',
    message: '風が良い方向に吹いています。今日は自分から動くことで、思っていた以上の結果が返ってくるでしょう。小さな一歩が未来を変えます。',
    resultColor: K.blue,
    bg: `linear-gradient(150deg, ${K.bg} 0%, #ddeeff 100%)`,
    cardBg: 'rgba(255,255,255,0.92)', cardBorder: K.light,
    accent: K.blue, shimmer: 'shimmerBlue',
    anim: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
  },
  {
    id: 'chukichi', result: '中吉', reading: 'ちゅうきち',
    message: '穏やかで確かな運気。急がなくていい。今日は焦らず、目の前のことをひとつひとつ丁寧に。その積み重ねが、気づけば大きな力になっています。',
    resultColor: '#2a7a40',
    bg: 'linear-gradient(150deg, #f0faf4 0%, #c8ecd4 100%)',
    cardBg: 'rgba(255,255,255,0.92)', cardBorder: '#70c888',
    accent: '#2a7a40', shimmer: 'shimmerBlue',
    anim: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
  },
  {
    id: 'shokichi', result: '小吉', reading: 'しょうきち',
    message: '柔らかい光が差し込む日。誰かへの小さな親切が、思わぬところで実を結ぶかもしれません。今日は「受け取る」より「与える」ことを意識して。',
    resultColor: '#1a70a0',
    bg: 'linear-gradient(150deg, #f0f6fc 0%, #cce0f4 100%)',
    cardBg: 'rgba(255,255,255,0.92)', cardBorder: '#60a8d8',
    accent: '#1a70a0', shimmer: 'shimmerBlue',
    anim: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
  },
  {
    id: 'suekichi', result: '末吉', reading: 'すえきち',
    message: '今はまだ、種が土の中にいる時間。焦らなくていい。水をやり続けた先に、必ず芽が出る瞬間があります。今日はその土台を作る日です。',
    resultColor: '#7040a0',
    bg: 'linear-gradient(150deg, #f6f0fc 0%, #e0ccf0 100%)',
    cardBg: 'rgba(255,255,255,0.92)', cardBorder: '#a870d0',
    accent: '#7040a0', shimmer: 'shimmerBlue',
    anim: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
  },
  {
    id: 'kyo', result: '凶', reading: 'きょう',
    message: '嵐の中にいる日。でも、嵐は必ず過ぎ去ります。今日は守りに徹し、エネルギーを温存して。明日のための静寂を、今日は大切にしてください。',
    resultColor: '#505860',
    bg: 'linear-gradient(150deg, #1a2030 0%, #0f1520 100%)',
    cardBg: 'rgba(30,36,50,0.92)', cardBorder: '#404858',
    accent: '#8090a8', shimmer: 'shimmerGray',
    anim: 'sadDrop 0.6s cubic-bezier(0.22,1,0.36,1) forwards',
  },
]

function getLucky(): string {
  return LUCKY_ITEMS[Math.floor(Math.random() * LUCKY_ITEMS.length)]
}

type Phase = 'shaking' | 'stick' | 'result'

// ── CSS アニメーション ──────────────────────────────
const CSS_ANIM = `
  @keyframes shakeBox {
    0%   { transform: translateX(-50%) rotate(0deg) translateY(0px); }
    8%   { transform: translateX(-56%) rotate(-12deg) translateY(-3px); }
    16%  { transform: translateX(-44%) rotate(12deg) translateY(-5px); }
    24%  { transform: translateX(-57%) rotate(-14deg) translateY(-3px); }
    32%  { transform: translateX(-43%) rotate(14deg) translateY(-6px); }
    40%  { transform: translateX(-56%) rotate(-11deg) translateY(-4px); }
    48%  { transform: translateX(-44%) rotate(11deg) translateY(-5px); }
    56%  { transform: translateX(-55%) rotate(-9deg) translateY(-3px); }
    64%  { transform: translateX(-45%) rotate(9deg) translateY(-4px); }
    72%  { transform: translateX(-53%) rotate(-7deg) translateY(-2px); }
    80%  { transform: translateX(-47%) rotate(7deg) translateY(-3px); }
    88%  { transform: translateX(-52%) rotate(-4deg) translateY(-1px); }
    100% { transform: translateX(-50%) rotate(0deg) translateY(0px); }
  }
  @keyframes tiltBox {
    0%   { transform: translateX(-50%) rotate(0deg); }
    100% { transform: translateX(-30%) rotate(32deg); }
  }
  @keyframes stickSlide {
    0%   { height: 0; opacity: 0; }
    20%  { opacity: 1; }
    100% { height: 150px; opacity: 1; }
  }
  @keyframes stickNumFade {
    0%,65% { opacity: 0; }
    100%   { opacity: 1; }
  }
  @keyframes sticksBounce {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-5px); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.5); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes sadDrop {
    from { opacity: 0; transform: translateY(-40px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmerGold {
    0%,100% { text-shadow: 0 0 20px rgba(255,180,0,0.4); }
    50%     { text-shadow: 0 0 50px rgba(255,210,0,1), 0 0 90px rgba(255,140,0,0.5); }
  }
  @keyframes shimmerBlue {
    0%,100% { text-shadow: 0 0 10px rgba(100,160,255,0.3); }
    50%     { text-shadow: 0 0 30px rgba(100,160,255,0.8); }
  }
  @keyframes shimmerGray {
    0%,100% { text-shadow: 0 0 8px rgba(150,160,170,0.3); }
    50%     { text-shadow: 0 0 20px rgba(150,160,170,0.6); }
  }
  @keyframes logoGlow {
    0%,100% { filter: drop-shadow(0 0 4px rgba(132,172,252,0.4)); }
    50%     { filter: drop-shadow(0 0 14px rgba(132,172,252,0.8)); }
  }
  @keyframes confettiFall {
    0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(110vh) rotate(600deg); opacity: 0; }
  }
  @keyframes rainFall {
    0%   { transform: translateY(-30px); opacity: 0; }
    10%  { opacity: 0.45; }
    100% { transform: translateY(110vh); opacity: 0; }
  }
  @keyframes float {
    0%,100% { transform: translateX(-50%) translateY(0px); }
    50%     { transform: translateX(-50%) translateY(-6px); }
  }
  @keyframes ropeSwing {
    0%,100% { transform: rotate(-2deg); }
    50%     { transform: rotate(2deg); }
  }
`

// ── おみくじ筒 SVG（高品質版）──────────────────────
function OmikujiBox({ shaking, tilting, stickNumber }: {
  shaking: boolean; tilting: boolean; stickNumber: number
}) {
  const isIdle = !shaking && !tilting

  return (
    <div style={{ position: 'relative', width: '220px', height: '360px', margin: '0 auto' }}>

      {/* 棒（筒の上から出てくる） */}
      {tilting && (
        <div style={{
          position: 'absolute',
          top: '140px',
          left: '50%',
          marginLeft: '-6px',
          zIndex: 5,
          overflow: 'visible',
          animation: 'stickSlide 1.8s cubic-bezier(0.22,1,0.36,1) 0.4s forwards',
          height: 0,
          transformOrigin: 'bottom center',
          transform: 'rotate(-32deg)',
        }}>
          <svg width="14" height="150" viewBox="0 0 14 150" overflow="visible">
            {/* 棒の影 */}
            <rect x="8" y="0" width="4" height="150" rx="2" fill="rgba(0,0,0,0.1)" />
            {/* 棒本体 */}
            <rect x="2" y="0" width="10" height="150" rx="3" fill="url(#sg)" />
            {/* 光沢 */}
            <rect x="3" y="0" width="3" height="150" rx="1.5" fill="rgba(255,255,255,0.3)" />
            {/* 番号 */}
            <text x="7" y="26" textAnchor="middle" fontSize="8" fontWeight="bold"
              fill="#4a2800" fontFamily="serif"
              style={{ animation: 'stickNumFade 2s ease forwards', opacity: 0 }}>
              {stickNumber}
            </text>
            <defs>
              <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#c8a858" />
                <stop offset="45%" stopColor="#eedea0" />
                <stop offset="100%" stopColor="#b89040" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {/* 筒本体 */}
      <div style={{
        position: 'absolute',
        top: '150px',
        left: '50%',
        animation: shaking
          ? 'shakeBox 0.5s ease-in-out infinite'
          : tilting
          ? 'tiltBox 1s cubic-bezier(0.22,1,0.36,1) forwards'
          : isIdle
          ? 'float 3s ease-in-out infinite'
          : 'none',
        transformOrigin: '50% 100%',
        transform: 'translateX(-50%)',
      }}>
        <svg width="120" height="210" viewBox="0 0 120 210" fill="none">
          {/* 影（楕円） */}
          <ellipse cx="60" cy="205" rx="50" ry="8" fill="rgba(0,0,0,0.10)" />

          {/* ── 六角形風 3面構成 ── */}
          {/* 左面（暗） */}
          <path d="M10 24 L34 16 L34 188 L10 196 Z" fill="url(#wL2)" />
          {/* 中央面（明） */}
          <path d="M34 16 L86 16 L86 188 L34 188 Z" fill="url(#wC2)" />
          {/* 右面（暗） */}
          <path d="M86 16 L110 24 L110 196 L86 188 Z" fill="url(#wR2)" />

          {/* 上面楕円 */}
          <ellipse cx="60" cy="16" rx="50" ry="12" fill="url(#wT2)" />
          {/* 上面縁 */}
          <ellipse cx="60" cy="16" rx="50" ry="12" fill="none" stroke="#b07828" strokeWidth="1" />

          {/* 穴（上面中央） */}
          <ellipse cx="60" cy="14" rx="10" ry="6" fill="#0f0800" />
          <ellipse cx="60" cy="14" rx="7" ry="4" fill="#050300" />
          {/* 穴のハイライト */}
          <ellipse cx="57" cy="12" rx="3" ry="1.5" fill="rgba(255,255,255,0.08)" />

          {/* ── 金帯 ── */}
          {/* 上縁ライン */}
          <line x1="10" y1="58" x2="110" y2="58" stroke="#f0c840" strokeWidth="2" opacity="0.7" />
          {/* 金帯本体 */}
          <path d="M10 60 L110 60 L110 108 L10 108 Z" fill="url(#gB2)" />
          {/* 御神籤テキスト */}
          <text x="60" y="94" textAnchor="middle" fontSize="15" fontWeight="bold"
            fill="#2a1000" fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', serif"
            letterSpacing="2">御神籤</text>
          {/* 下縁ライン */}
          <line x1="10" y1="108" x2="110" y2="108" stroke="#b07820" strokeWidth="2" opacity="0.7" />

          {/* 木目（細かく） */}
          {[128, 143, 158, 173].map((y, i) => (
            <line key={i} x1="34" y1={y} x2="86" y2={y}
              stroke="rgba(80,40,10,0.12)" strokeWidth="1" />
          ))}

          {/* シャカシャカ時：穴から棒がはみ出す */}
          {shaking && [51, 57, 63, 69, 75].map((x, i) => (
            <rect key={i}
              x={x} y={i % 2 === 0 ? -6 : -2}
              width="5" height={i % 2 === 0 ? 22 : 16}
              rx="2" fill="#f4e09a"
              opacity={0.4 + i * 0.1}
              style={{ animation: `sticksBounce ${0.25 + i * 0.04}s ease-in-out infinite` }}
            />
          ))}

          {/* 底面 */}
          <ellipse cx="60" cy="192" rx="50" ry="9" fill="url(#wB2)" />

          <defs>
            <linearGradient id="wL2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5a3810" /><stop offset="100%" stopColor="#7a5020" />
            </linearGradient>
            <linearGradient id="wC2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#b87c2c" /><stop offset="20%" stopColor="#d09840" />
              <stop offset="50%" stopColor="#e8b858" /><stop offset="80%" stopColor="#cfa040" />
              <stop offset="100%" stopColor="#a87030" />
            </linearGradient>
            <linearGradient id="wR2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7a5020" /><stop offset="100%" stopColor="#5a3810" />
            </linearGradient>
            <linearGradient id="wT2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8c868" /><stop offset="100%" stopColor="#b88830" />
            </linearGradient>
            <linearGradient id="wB2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8a5820" /><stop offset="100%" stopColor="#5a3810" />
            </linearGradient>
            <linearGradient id="gB2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f8e060" /><stop offset="35%" stopColor="#e8c838" />
              <stop offset="100%" stopColor="#b89018" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 神社の縄（しめ縄風装飾） */}
      {!tilting && (
        <div style={{
          position: 'absolute', top: '130px', left: '50%',
          transform: 'translateX(-50%)',
          width: '140px', height: '12px',
          pointerEvents: 'none',
          animation: 'ropeSwing 4s ease-in-out infinite',
          transformOrigin: 'center top',
          opacity: 0.35,
        }}>
          <svg width="140" height="12" viewBox="0 0 140 12">
            <path d="M0 6 Q35 2 70 6 Q105 10 140 6" stroke="#c8a030" strokeWidth="2.5"
              fill="none" strokeLinecap="round" />
            <path d="M0 6 Q35 10 70 6 Q105 2 140 6" stroke="#a07820" strokeWidth="1.5"
              fill="none" strokeLinecap="round" opacity="0.6" />
          </svg>
        </div>
      )}
    </div>
  )
}

// 大吉：紙吹雪
function Confetti() {
  const colors = ['#FFD700','#FF6B6B','#FF9FF3','#54A0FF','#5CE65C','#FFA500','#fff','#c8a0ff']
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      {Array.from({ length: 60 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: '-12px',
          width: `${4 + Math.random() * 8}px`,
          height: `${6 + Math.random() * 12}px`,
          background: colors[i % colors.length],
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          animation: `confettiFall ${1.5 + Math.random() * 3}s ease-in ${i * 0.04}s forwards`,
        }} />
      ))}
    </div>
  )
}

// 凶：雨
function Rain() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      {Array.from({ length: 35 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: '-30px',
          width: '1px',
          height: `${20 + Math.random() * 35}px`,
          background: 'linear-gradient(to bottom, transparent, rgba(140,170,210,0.4))',
          animation: `rainFall ${0.8 + Math.random() * 1.4}s linear ${i * 0.1}s infinite`,
        }} />
      ))}
    </div>
  )
}

// KATAOMOIロゴ
function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', animation: 'logoGlow 3s ease-in-out infinite' }}>
      <svg width="18" height="17" viewBox="0 0 24 22" fill="none">
        <path d="M12 20C12 20 1 13 1 7C1 4 3.5 2 6.5 2C8.5 2 10.3 3 11.5 4.5C12.7 3 14.5 2 16.5 2C19.5 2 22 4 22 7C22 13 12 20 12 20Z"
          fill="rgba(132,172,252,0.45)" style={{ filter: 'blur(2px)' }} />
        <path d="M12 19C12 19 2 12.5 2 7.5C2 4.7 4.2 2.5 7 2.5C8.8 2.5 10.4 3.4 11.5 4.8C12.6 3.4 14.2 2.5 16 2.5C18.8 2.5 21 4.7 21 7.5C21 12.5 12 19 12 19Z"
          fill="rgba(200,220,255,0.95)" />
      </svg>
      <span style={{
        fontSize: '11px', fontWeight: '700', letterSpacing: '0.22em',
        color: 'rgba(210,225,255,0.92)',
        fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
      }}>KATAOMOI</span>
    </div>
  )
}

export default function OmikujiApp() {
  const [phase, setPhase] = useState<Phase>('shaking')
  const [fortune, setFortune] = useState(() => FORTUNES[Math.floor(Math.random() * FORTUNES.length)])
  const [stickNumber, setStickNumber] = useState(() => Math.floor(Math.random() * 50) + 1)
  const [luckyItem, setLuckyItem] = useState<string>(getLucky)
  const [showEffects, setShowEffects] = useState(false)
  const [shaking, setShaking] = useState(true)
  const [tilting, setTilting] = useState(false)

  const isDaikichi = fortune.id === 'daikichi'
  const isKyo = fortune.id === 'kyo'

  useEffect(() => {
    if (phase === 'shaking') {
      setShaking(true)
      setTilting(false)
      const t = setTimeout(() => {
        setShaking(false)
        setTilting(true)
        setPhase('stick')
      }, 4000)
      return () => clearTimeout(t)
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'stick') {
      const t = setTimeout(() => {
        setTilting(false)
        setPhase('result')
        setTimeout(() => setShowEffects(true), 500)
      }, 2500)
      return () => clearTimeout(t)
    }
  }, [phase])

  const handleReset = useCallback(() => {
    setShowEffects(false)
    setShaking(false)
    setTilting(false)
    setFortune(FORTUNES[Math.floor(Math.random() * FORTUNES.length)])
    setStickNumber(Math.floor(Math.random() * 50) + 1)
    setLuckyItem(getLucky())
    setPhase('shaking')
  }, [])

  const isResult = phase === 'result'

  return (
    <>
      <style>{CSS_ANIM}</style>
      <div style={{
        minHeight: '100vh',
        background: isResult ? fortune.bg : `linear-gradient(150deg, ${K.bg} 0%, #ddeeff 100%)`,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        transition: 'background 0.8s ease',
        fontFamily: "'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif",
      }}>
        {isResult && showEffects && isDaikichi && <Confetti />}
        {isResult && showEffects && isKyo && <Rain />}

        {/* ヘッダー */}
        <header style={{
          width: '100%', padding: '13px 20px',
          background: K.navy,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 20,
          borderBottom: '1px solid rgba(132,172,252,0.15)',
        }}>
          <Logo />
          <span style={{
            fontSize: '12px', fontWeight: '600', letterSpacing: '0.2em',
            color: 'rgba(200,218,255,0.55)',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
          }}>おみくじ</span>
        </header>

        <main style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '16px 20px',
        }}>

          {/* シャカシャカ & 棒が出るシーン */}
          {(phase === 'shaking' || phase === 'stick') && (
            <div style={{ textAlign: 'center', animation: 'fadeInUp 0.5s ease forwards' }}>
              {/* 神社の雰囲気パネル */}
              <div style={{
                width: 'min(320px, 90vw)',
                margin: '0 auto',
                background: 'linear-gradient(180deg, #fdf8f0 0%, #f5ead8 100%)',
                borderRadius: '20px',
                padding: '10px 20px 30px',
                boxShadow: `0 12px 48px rgba(30,90,159,0.12), 0 2px 8px rgba(0,0,0,0.06)`,
                border: '1px solid rgba(200,160,60,0.25)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* 装飾ライン上 */}
                <div style={{
                  height: '3px',
                  background: 'repeating-linear-gradient(90deg, #d4a020 0px, #d4a020 12px, transparent 12px, transparent 20px)',
                  opacity: 0.5, marginBottom: '8px', borderRadius: '2px',
                }} />

                <OmikujiBox shaking={shaking} tilting={tilting} stickNumber={stickNumber} />

                <div style={{
                  marginTop: '8px',
                  fontSize: phase === 'shaking' ? '14px' : '20px',
                  fontWeight: phase === 'shaking' ? '400' : '700',
                  color: phase === 'shaking' ? '#9a7040' : '#3a1800',
                  letterSpacing: '0.3em',
                  transition: 'all 0.3s',
                }}>
                  {phase === 'shaking' ? 'シャカシャカ…' : `第 ${stickNumber} 番`}
                </div>

                {/* 装飾ライン下 */}
                <div style={{
                  height: '3px',
                  background: 'repeating-linear-gradient(90deg, #d4a020 0px, #d4a020 12px, transparent 12px, transparent 20px)',
                  opacity: 0.5, marginTop: '12px', borderRadius: '2px',
                }} />
              </div>
            </div>
          )}

          {/* 結果 */}
          {isResult && (
            <div style={{
              animation: 'fadeInUp 0.5s ease forwards',
              width: '100%', maxWidth: '420px',
              position: 'relative', zIndex: 1,
              padding: '0 0 4px',
            }}>
              <p style={{
                textAlign: 'center', fontSize: '11px', fontWeight: '700',
                letterSpacing: '0.35em', marginBottom: '6px',
                color: isKyo ? 'rgba(180,195,215,0.45)' : `${fortune.accent}80`,
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
              }}>NO. {stickNumber}</p>

              {/* 運勢文字 */}
              <div style={{
                textAlign: 'center',
                fontSize: 'clamp(80px, 24vw, 116px)',
                fontWeight: '900',
                color: fortune.resultColor,
                lineHeight: 1, marginBottom: '6px',
                animation: `${fortune.anim}, ${fortune.shimmer} 2.5s ease-in-out 0.6s infinite`,
                fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', 'Georgia', serif",
              }}>{fortune.result}</div>

              <p style={{
                textAlign: 'center', fontSize: '12px', letterSpacing: '0.4em',
                marginBottom: '20px',
                color: isKyo ? 'rgba(180,195,215,0.4)' : `${fortune.accent}70`,
              }}>{fortune.reading}</p>

              {/* カード */}
              <div style={{
                background: fortune.cardBg,
                border: `1px solid ${fortune.cardBorder}`,
                borderRadius: '14px', padding: '20px',
                marginBottom: '14px',
                backdropFilter: 'blur(16px)',
                boxShadow: isDaikichi
                  ? '0 6px 30px rgba(220,170,0,0.15)'
                  : isKyo
                  ? '0 6px 30px rgba(0,0,0,0.5)'
                  : '0 4px 20px rgba(30,90,159,0.08)',
              }}>
                {/* メッセージ */}
                <p style={{
                  fontSize: '14px', lineHeight: '1.9',
                  color: isKyo ? 'rgba(195,210,228,0.88)' : fortune.accent,
                  marginBottom: '18px',
                  textAlign: 'center',
                  fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif",
                }}>{fortune.message}</p>

                {/* ラッキーアイテム（全運勢共通） */}
                <div style={{
                  borderTop: `1px solid ${fortune.cardBorder}70`,
                  paddingTop: '16px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '10px', fontWeight: '700',
                    letterSpacing: '0.4em', marginBottom: '12px',
                    color: isKyo ? 'rgba(160,180,210,0.55)' : `${fortune.accent}80`,
                    fontFamily: "'Helvetica Neue', Arial, sans-serif",
                  }}>LUCKY ITEM</div>
                  <div style={{
                    display: 'inline-block',
                    background: isDaikichi
                      ? 'rgba(255,210,0,0.12)'
                      : isKyo
                      ? 'rgba(80,100,130,0.3)'
                      : `${fortune.accent}12`,
                    borderRadius: '12px',
                    padding: '14px 32px',
                    border: `1px solid ${fortune.cardBorder}70`,
                    minWidth: '160px',
                  }}>
                    <span style={{
                      fontSize: '20px', fontWeight: '700',
                      color: isKyo ? 'rgba(190,205,225,0.85)' : fortune.resultColor,
                      fontFamily: "'Hiragino Sans', sans-serif",
                      letterSpacing: '0.05em',
                    }}>{luckyItem}</span>
                  </div>
                </div>
              </div>

              {/* もう一度ボタン */}
              <button
                onClick={handleReset}
                style={{
                  display: 'block', width: '100%', padding: '15px',
                  fontSize: '15px', fontWeight: '600',
                  letterSpacing: '0.2em',
                  background: isKyo ? 'rgba(50,65,90,0.85)' : K.navy,
                  color: K.white, border: 'none', borderRadius: '10px',
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: isKyo ? 'none' : `0 4px 18px ${K.navy}50`,
                  fontFamily: "'Hiragino Sans', sans-serif",
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; e.currentTarget.style.transform = 'translateY(-1px)' }}
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
