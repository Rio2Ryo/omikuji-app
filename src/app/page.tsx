'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import AdminPanel from './AdminPanel'

// Three.jsはSSRなしで動的ロード
const OmikujiScene3D = dynamic(() => import('./OmikujiScene3D'), { ssr: false })

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
  '桜の花びら', '黒猫', '四つ葉のクローバー',
  '古い本', 'コーヒー', 'ミントの葉', 'フクロウの置物',
  'ひまわり', '緑茶', '松ぼっくり',
  '白い石', '赤いリボン', '青いペン', 'ポストカード',
  '小さなサボテン', 'お守り', '貝殻', '木の実',
  '風鈴', '和紙', '丸い小石', 'ドライフラワー',
  '手ぬぐい', '折り紙', 'ろうそく', '小さな鈴',
  '苔玉', '竹の箸', '陶器のカップ', '線香',
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
  /* ===== シャカシャカ：筒が弧を描いて揺れる ===== */
  @keyframes shakeBox {
    0%   { transform: translateX(-50%) rotate(0deg)   translateY(0px);   }
    8%   { transform: translateX(-50%) rotate(-8deg)  translateY(-3px);  }
    20%  { transform: translateX(-50%) rotate(9deg)   translateY(-8px);  }
    32%  { transform: translateX(-50%) rotate(-10deg) translateY(-4px);  }
    44%  { transform: translateX(-50%) rotate(10deg)  translateY(-9px);  }
    56%  { transform: translateX(-50%) rotate(-8deg)  translateY(-3px);  }
    68%  { transform: translateX(-50%) rotate(8deg)   translateY(-7px);  }
    80%  { transform: translateX(-50%) rotate(-5deg)  translateY(-2px);  }
    92%  { transform: translateX(-50%) rotate(4deg)   translateY(-4px);  }
    100% { transform: translateX(-50%) rotate(0deg)   translateY(0px);   }
  }
  @keyframes tiltBox {
    0%   { transform: translateX(-50%) rotate(0deg); }
    100% { transform: translateX(-28%) rotate(30deg); }
  }
  @keyframes stickSlide {
    0%   { height: 0px;   opacity: 0; }
    15%  { opacity: 1; }
    100% { height: 160px; opacity: 1; }
  }
  @keyframes stickNumFade {
    0%,60% { opacity: 0; }
    100%   { opacity: 1; }
  }
  /* 棒が穴からチョロチョロ出る（シャカシャカ時） */
  @keyframes stickPeek0 {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-5px); }
  }
  @keyframes stickPeek1 {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-7px); }
  }
  @keyframes stickPeek2 {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-4px); }
  }
  @keyframes stickPeek3 {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-8px); }
  }
  @keyframes stickPeek4 {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-6px); }
  }
  /* 揺れ待機アニメ */
  @keyframes float {
    0%,100% { transform: translateX(-50%) translateY(0px); }
    50%     { transform: translateX(-50%) translateY(-6px); }
  }
  /* 下部：しめ縄 */
  @keyframes ropeSwing {
    0%,100% { transform: rotate(-1.5deg); }
    50%     { transform: rotate(1.5deg); }
  }
  /* 結果フェード */
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.4); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes sadDrop {
    from { opacity: 0; transform: translateY(-30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmerGold {
    0%,100% { text-shadow: 0 0 20px rgba(255,180,0,0.4); }
    50%     { text-shadow: 0 0 60px rgba(255,210,0,1), 0 0 100px rgba(255,140,0,0.5); }
  }
  @keyframes shimmerBlue {
    0%,100% { text-shadow: 0 0 10px rgba(100,160,255,0.3); }
    50%     { text-shadow: 0 0 30px rgba(100,160,255,0.8); }
  }
  @keyframes shimmerGray {
    0%,100% { text-shadow: 0 0 8px rgba(150,160,170,0.3); }
    50%     { text-shadow: 0 0 22px rgba(150,160,170,0.6); }
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
`

// ── おみくじ筒 SVG（Lottie風・高品質アニメ版）─────────────────
function OmikujiBox({ shaking, tilting, stickNumber }: {
  shaking: boolean; tilting: boolean; stickNumber: number
}) {
  const isIdle = !shaking && !tilting

  // shaking中に各棒がランダムに揺れる速度
  const peekAnims = ['stickPeek0', 'stickPeek1', 'stickPeek2', 'stickPeek3', 'stickPeek4']
  const peekDurs  = ['0.30s', '0.22s', '0.38s', '0.26s', '0.34s']

  return (
    <div style={{ position: 'relative', width: '240px', height: '380px', margin: '0 auto' }}>

      {/* ── 棒が出てくる（tilt時のみ） ── */}
      {tilting && (
        <div style={{
          position: 'absolute',
          top: '128px',
          left: '50%',
          width: '14px',
          height: 0,
          marginLeft: '-5px',
          zIndex: 10,
          transformOrigin: 'bottom center',
          transform: 'rotate(-30deg)',
          animation: 'stickSlide 2.0s cubic-bezier(0.16,1,0.3,1) 0.5s forwards',
        }}>
          <svg width="14" height="160" viewBox="0 0 14 160" overflow="visible">
            <defs>
              <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#b89030" />
                <stop offset="40%"  stopColor="#f0e090" />
                <stop offset="100%" stopColor="#b08020" />
              </linearGradient>
            </defs>
            {/* 影 */}
            <rect x="9" y="0" width="4" height="160" rx="2" fill="rgba(0,0,0,0.12)" />
            {/* 棒本体 */}
            <rect x="1" y="0" width="11" height="160" rx="3" fill="url(#sg)" />
            {/* 光沢 */}
            <rect x="2" y="0" width="3" height="160" rx="1.5" fill="rgba(255,255,255,0.35)" />
            {/* 番号 */}
            <text x="6.5" y="22" textAnchor="middle" fontSize="8" fontWeight="bold"
              fill="#3a1800" fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', serif"
              style={{ animation: 'stickNumFade 2.5s ease forwards', opacity: 0 }}>
              {stickNumber}
            </text>
          </svg>
        </div>
      )}

      {/* ── 筒本体 ── */}
      <div style={{
        position: 'absolute',
        top: '148px',
        left: '50%',
        animation: shaking
          ? 'shakeBox 0.7s ease-in-out infinite'
          : tilting
          ? 'tiltBox 1.1s cubic-bezier(0.22,1,0.36,1) forwards'
          : isIdle
          ? 'float 3.5s ease-in-out infinite'
          : 'none',
        transformOrigin: '50% 100%',
        transform: 'translateX(-50%)',
        zIndex: 2,
      }}>
        <svg width="130" height="220" viewBox="0 0 130 220" fill="none">
          <defs>
            <linearGradient id="wL" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3a2008" />
              <stop offset="100%" stopColor="#5a3010" />
            </linearGradient>
            <linearGradient id="wC" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#a06020" />
              <stop offset="15%"  stopColor="#c88030" />
              <stop offset="45%"  stopColor="#e8aa50" />
              <stop offset="75%"  stopColor="#c88030" />
              <stop offset="100%" stopColor="#9a5818" />
            </linearGradient>
            <linearGradient id="wR" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5a3010" />
              <stop offset="100%" stopColor="#3a2008" />
            </linearGradient>
            <linearGradient id="wT" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8c058" />
              <stop offset="100%" stopColor="#a07820" />
            </linearGradient>
            <linearGradient id="wB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7a4818" />
              <stop offset="100%" stopColor="#3a1808" />
            </linearGradient>
            <linearGradient id="gBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#ffe868" />
              <stop offset="30%"  stopColor="#e8c030" />
              <stop offset="100%" stopColor="#a88010" />
            </linearGradient>
            <filter id="tubeShad">
              <feDropShadow dx="3" dy="6" stdDeviation="6" floodColor="rgba(0,0,0,0.25)" />
            </filter>
          </defs>

          {/* 影（楕円） */}
          <ellipse cx="65" cy="214" rx="52" ry="9" fill="rgba(0,0,0,0.12)" />

          {/* 筒：3面構成（六角形風） */}
          <g filter="url(#tubeShad)">
            {/* 左面 */}
            <path d="M12 26 L38 17 L38 196 L12 205 Z" fill="url(#wL)" />
            {/* 中央面 */}
            <path d="M38 17 L92 17 L92 196 L38 196 Z" fill="url(#wC)" />
            {/* 右面 */}
            <path d="M92 17 L118 26 L118 205 L92 196 Z" fill="url(#wR)" />
          </g>

          {/* 上面楕円 */}
          <ellipse cx="65" cy="17" rx="53" ry="13" fill="url(#wT)" />
          <ellipse cx="65" cy="17" rx="53" ry="13" fill="none" stroke="#c09020" strokeWidth="1.5" />

          {/* 穴（上面中央）：棒が出てくる穴 */}
          <ellipse cx="65" cy="15" rx="11" ry="6.5" fill="#0a0600" />
          <ellipse cx="65" cy="15" rx="8"  ry="4.5" fill="#050300" />
          <ellipse cx="62" cy="13" rx="3"  ry="1.5" fill="rgba(255,255,255,0.07)" />

          {/* 金帯：上縁 */}
          <line x1="12" y1="62" x2="118" y2="62" stroke="#fcd840" strokeWidth="2.5" opacity="0.8" />
          {/* 金帯本体 */}
          <rect x="12" y="64" width="106" height="50" fill="url(#gBand)" />
          {/* 御神籤テキスト */}
          <text x="65" y="97" textAnchor="middle" fontSize="16" fontWeight="bold"
            fill="#2a1000" fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', serif"
            letterSpacing="3">御神籤</text>
          {/* 金帯：下縁 */}
          <line x1="12" y1="114" x2="118" y2="114" stroke="#a07010" strokeWidth="2.5" opacity="0.8" />

          {/* 木目 */}
          {[134, 150, 166, 180].map((y, i) => (
            <line key={i} x1="38" y1={y} x2="92" y2={y}
              stroke="rgba(60,30,5,0.10)" strokeWidth="1" />
          ))}

          {/* シャカシャカ時：棒がチョロチョロ見える */}
          {shaking && [54, 60, 65, 70, 76].map((x, i) => (
            <rect key={i}
              x={x - 2} y={-10}
              width={i === 2 ? 7 : 5}
              height={i % 2 === 0 ? 20 : 14}
              rx="2"
              fill={i % 2 === 0 ? '#f0dc80' : '#e8c860'}
              opacity={0.5 + i * 0.08}
              style={{ animation: `${peekAnims[i]} ${peekDurs[i]} ease-in-out infinite` }}
            />
          ))}

          {/* 底面 */}
          <ellipse cx="65" cy="200" rx="53" ry="10" fill="url(#wB)" />
        </svg>
      </div>

      {/* しめ縄（待機時のみ） */}
      {isIdle && (
        <div style={{
          position: 'absolute', top: '135px', left: '50%',
          transform: 'translateX(-50%)',
          width: '150px', height: '14px',
          pointerEvents: 'none',
          animation: 'ropeSwing 4s ease-in-out infinite',
          transformOrigin: 'center top',
          opacity: 0.3,
        }}>
          <svg width="150" height="14" viewBox="0 0 150 14">
            <path d="M0 7 Q37 2 75 7 Q113 12 150 7" stroke="#c8a030" strokeWidth="2.5"
              fill="none" strokeLinecap="round" />
            <path d="M0 7 Q37 12 75 7 Q113 2 150 7" stroke="#a07820" strokeWidth="1.5"
              fill="none" strokeLinecap="round" opacity="0.5" />
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
  const [redirectUrl, setRedirectUrl] = useState('https://kataomoi.org')
  const [showAdmin, setShowAdmin] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [tilting, setTilting] = useState(false)

  const isDaikichi = fortune.id === 'daikichi'
  const isKyo = fortune.id === 'kyo'

  // URLパラメータからuuidを取得してリダイレクトURL取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const uuid = params.get('uuid') || params.get('cardId')
    if (uuid) {
      fetch(`/api/redirect?uuid=${encodeURIComponent(uuid)}`)
        .then(r => r.json())
        .then(d => { if (d.url) setRedirectUrl(d.url) })
        .catch(() => {})
    }
    // uuidなし = デフォルトURL（kataomoi.org）のまま
  }, [])

  // 結果表示後3秒でリダイレクト（管理画面が開いている間は停止）
  useEffect(() => {
    if (phase !== 'result') return
    if (showAdmin) {
      // 管理中はカウント停止
      if (countdownRef.current) clearInterval(countdownRef.current)
      setCountdown(null)
      return
    }
    let c = 3
    setCountdown(c)
    countdownRef.current = setInterval(() => {
      c--
      setCountdown(c)
      if (c <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current)
        window.location.href = redirectUrl
      }
    }, 1000)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [phase, redirectUrl, showAdmin])

  useEffect(() => {
    if (phase === 'shaking') {
      setShaking(true)
      setTilting(false)
      const t = setTimeout(() => {
        setShaking(false)
        setTilting(true)
        setPhase('stick')
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'stick') {
      // onTiltDoneコールバックで遷移するため、フォールバック用のタイマーのみ
      const t = setTimeout(() => {
        setTilting(false)
        setPhase('result')
        setTimeout(() => setShowEffects(true), 500)
      }, 3500)
      return () => clearTimeout(t)
    }
  }, [phase])

  const handleTiltDone = useCallback(() => {
    setTimeout(() => {
      setTilting(false)
      setPhase('result')
      setTimeout(() => setShowEffects(true), 500)
    }, 800)
  }, [])

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
            <div style={{ textAlign: 'center', animation: 'fadeInUp 0.5s ease forwards', width: '100%' }}>
              {/* 3D シーンコンテナ */}
              <div style={{
                width: 'min(360px, 94vw)',
                height: 'min(480px, 62vw, 68vh)',
                margin: '0 auto',
                position: 'relative',
                borderRadius: '24px',
                overflow: 'hidden',
                background: 'linear-gradient(160deg, #0a1428 0%, #0f1f3d 40%, #1a3060 100%)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(132,172,252,0.12)',
              }}>
                {/* 背景：光の放射 */}
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 0,
                  background: 'radial-gradient(ellipse 70% 60% at 50% 60%, rgba(30,90,160,0.35) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />

                {/* Three.js シーン */}
                <OmikujiScene3D
                  shaking={shaking}
                  tilting={tilting}
                  stickNumber={stickNumber}
                  onTiltDone={handleTiltDone}
                />

                {/* オーバーレイテキスト */}
                <div style={{
                  position: 'absolute', bottom: '20px', left: 0, right: 0,
                  textAlign: 'center', zIndex: 10, pointerEvents: 'none',
                }}>
                  <p style={{
                    fontSize: phase === 'shaking' ? '13px' : '18px',
                    fontWeight: phase === 'shaking' ? '400' : '700',
                    color: phase === 'shaking' ? 'rgba(220,200,140,0.8)' : 'rgba(240,220,120,0.95)',
                    letterSpacing: '0.35em',
                    textShadow: '0 1px 8px rgba(0,0,0,0.8)',
                    transition: 'all 0.4s',
                  }}>
                    {phase === 'shaking' ? 'シャカシャカ…' : `第 ${stickNumber} 番`}
                  </p>
                </div>
              </div>

              {/* 管理ボタン */}
              <button
                onClick={() => setShowAdmin(true)}
                style={{ marginTop: '14px', padding: '6px 16px', fontSize: '11px', background: 'transparent', color: 'rgba(100,130,180,0.5)', border: '1px solid rgba(100,130,180,0.2)', borderRadius: '6px', cursor: 'pointer', letterSpacing: '0.1em' }}
              >⚙ 管理</button>
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

              {/* カウントダウン */}
              {countdown !== null && countdown > 0 && (
                <p style={{ textAlign: 'center', fontSize: '12px', color: isKyo ? 'rgba(180,195,215,0.5)' : `${fortune.accent}70`, marginTop: '10px', letterSpacing: '0.1em' }}>
                  {countdown}秒後に移動します...
                </p>
              )}

              {/* 管理ボタン */}
              <button
                onClick={() => setShowAdmin(true)}
                style={{ display: 'block', width: '100%', marginTop: '8px', padding: '8px', fontSize: '11px', background: 'transparent', color: 'rgba(100,130,180,0.4)', border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer', letterSpacing: '0.1em' }}
              >⚙ 管理</button>
            </div>
          )}
        </main>
      </div>

      {/* 管理パネル（モーダル） */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </>
  )
}
