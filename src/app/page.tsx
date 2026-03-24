'use client'

import { useState, useEffect, useCallback, useRef, Suspense, Component, ErrorInfo, ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'

// Three.jsはSSRなしで動的ロード
const OmikujiScene3D = dynamic(() => import('./OmikujiScene3D'), { ssr: false })

// WebGL失敗時のエラーバウンダリ
class WebGLErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('WebGL/Three.js failed, switching to SVG fallback:', error, info)
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

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
    message: '直感を信じて動いて。今日、扉は開く。',
    resultColor: '#c07010',
    bg: 'linear-gradient(150deg, #fffbf0 0%, #fff3c0 40%, #ffe080 100%)',
    cardBg: 'rgba(255,255,255,0.92)', cardBorder: '#e8c030',
    accent: '#b86800', shimmer: 'shimmerGold',
    anim: 'scaleIn 0.5s cubic-bezier(0.34,1.8,0.64,1) forwards',
  },
  {
    id: 'kichi', result: '吉', reading: 'きち',
    message: '自分から動こう。小さな一歩が未来を変える。',
    resultColor: K.blue,
    bg: `linear-gradient(150deg, ${K.bg} 0%, #ddeeff 100%)`,
    cardBg: 'rgba(255,255,255,0.92)', cardBorder: K.light,
    accent: K.blue, shimmer: 'shimmerBlue',
    anim: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
  },
  {
    id: 'chukichi', result: '中吉', reading: 'ちゅうきち',
    message: '焦らなくていい。丁寧に積み重ねる日。',
    resultColor: '#2a7a40',
    bg: 'linear-gradient(150deg, #f0faf4 0%, #c8ecd4 100%)',
    cardBg: 'rgba(255,255,255,0.92)', cardBorder: '#70c888',
    accent: '#2a7a40', shimmer: 'shimmerBlue',
    anim: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
  },
  {
    id: 'shokichi', result: '小吉', reading: 'しょうきち',
    message: '与えることを意識して。親切が実を結ぶ。',
    resultColor: '#1a70a0',
    bg: 'linear-gradient(150deg, #f0f6fc 0%, #cce0f4 100%)',
    cardBg: 'rgba(255,255,255,0.92)', cardBorder: '#60a8d8',
    accent: '#1a70a0', shimmer: 'shimmerBlue',
    anim: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
  },
  {
    id: 'suekichi', result: '末吉', reading: 'すえきち',
    message: '今は土台を作る時間。芽は必ず出る。',
    resultColor: '#7040a0',
    bg: 'linear-gradient(150deg, #f6f0fc 0%, #e0ccf0 100%)',
    cardBg: 'rgba(255,255,255,0.92)', cardBorder: '#a870d0',
    accent: '#7040a0', shimmer: 'shimmerBlue',
    anim: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
  },
  {
    id: 'kyo', result: '凶', reading: 'きょう',
    message: '嵐は過ぎ去る。今日は守りに徹して。',
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

// ── 履歴 ────────────────────────────────────────────
interface FortuneRecord {
  id: string        // fortune.id
  result: string    // 大吉 etc
  resultColor: string
  stickNumber: number
  luckyItem: string
  date: string      // YYYY/MM/DD HH:mm
}
const HISTORY_KEY = 'omikuji_history'
const HISTORY_MAX = 5

function loadHistory(): FortuneRecord[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
function saveHistory(record: FortuneRecord) {
  const prev = loadHistory()
  const next = [record, ...prev].slice(0, HISTORY_MAX)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  return next
}

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

  /* ===== 結果画面 新演出 ===== */
  /* 暗転→解放 */
  @keyframes flashReveal {
    0%   { opacity: 0; }
    15%  { opacity: 1; background: rgba(255,255,255,0.95); }
    40%  { opacity: 1; background: rgba(255,255,255,0.0); }
    100% { opacity: 1; }
  }
  /* 掛け軸が上からするするっと降りてくる */
  @keyframes scrollUnroll {
    0%   { transform: scaleY(0) translateY(-20px); opacity: 0; transform-origin: top; }
    60%  { opacity: 1; }
    100% { transform: scaleY(1) translateY(0); opacity: 1; transform-origin: top; }
  }
  /* 運勢文字：墨が滲むように出現 */
  @keyframes inkBloom {
    0%   { opacity: 0; filter: blur(12px); transform: scale(1.3); }
    40%  { opacity: 0.7; filter: blur(4px); transform: scale(1.05); }
    100% { opacity: 1; filter: blur(0px); transform: scale(1); }
  }
  /* 鳥居パーティクルが上に流れる */
  @keyframes particleFloat {
    0%   { transform: translateY(0px) translateX(0px); opacity: 0; }
    10%  { opacity: 0.6; }
    100% { transform: translateY(-120vh) translateX(var(--dx, 20px)); opacity: 0; }
  }
  /* 光の放射（大吉用） */
  @keyframes burstRay {
    0%   { transform: rotate(var(--r,0deg)) scaleX(0); opacity: 0; }
    30%  { opacity: 0.7; }
    100% { transform: rotate(var(--r,0deg)) scaleX(1); opacity: 0; }
  }
  /* アイテム登場 */
  @keyframes itemReveal {
    0%   { opacity: 0; transform: translateY(10px) scale(0.9); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  /* メッセージ テキストフェード */
  @keyframes textFadeIn {
    0%   { opacity: 0; letter-spacing: 0.5em; }
    100% { opacity: 1; letter-spacing: 0.06em; }
  }
  /* 鳥居シルエットの揺れ */
  @keyframes toriiBreath {
    0%,100% { opacity: 0.04; transform: scale(1); }
    50%     { opacity: 0.07; transform: scale(1.01); }
  }
  /* HISTORY行 */
  @keyframes histFadeIn {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
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


// 大吉：紙吹雪（強化版）
function Confetti() {
  const colors = ['#FFD700','#FFC300','#FF9500','#fff8dc','#ffe066','#ffd700','#fff','#f0c040']
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      {/* 光の放射ライン */}
      {Array.from({ length: 12 }, (_, i) => (
        <div key={`ray-${i}`} style={{
          position: 'absolute', left: '50%', top: '40%',
          width: '2px', height: '80vw',
          background: 'linear-gradient(to bottom, rgba(255,220,80,0.6), transparent)',
          transformOrigin: 'top center',
          '--r': `${i * 30}deg`,
          animation: `burstRay 1.2s ease-out ${i * 0.05}s forwards`,
        } as React.CSSProperties} />
      ))}
      {Array.from({ length: 80 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: '-12px',
          width: `${3 + Math.random() * 7}px`,
          height: `${5 + Math.random() * 10}px`,
          background: colors[i % colors.length],
          borderRadius: Math.random() > 0.4 ? '50%' : '1px',
          opacity: 0.9,
          animation: `confettiFall ${1.2 + Math.random() * 2.5}s ease-in ${i * 0.03}s forwards`,
        }} />
      ))}
    </div>
  )
}

// 凶：雨（強化版）
function Rain() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      {Array.from({ length: 50 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${Math.random() * 110 - 5}%`,
          top: '-30px',
          width: '1px',
          height: `${25 + Math.random() * 40}px`,
          background: 'linear-gradient(to bottom, transparent, rgba(120,150,200,0.5))',
          animation: `rainFall ${0.6 + Math.random() * 1.2}s linear ${i * 0.07}s infinite`,
        }} />
      ))}
    </div>
  )
}

// 背景パーティクル（全運勢共通）
function BgParticles({ color }: { color: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 1 }}>
      {Array.from({ length: 18 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${10 + Math.random() * 80}%`,
          bottom: '-20px',
          width: `${3 + Math.random() * 5}px`,
          height: `${3 + Math.random() * 5}px`,
          borderRadius: '50%',
          background: color,
          opacity: 0,
          '--dx': `${(Math.random() - 0.5) * 60}px`,
          animation: `particleFloat ${3 + Math.random() * 4}s ease-out ${i * 0.3}s infinite`,
        } as React.CSSProperties} />
      ))}
    </div>
  )
}

// 鳥居シルエット（背景装飾）
function ToriiSilhouette({ color }: { color: string }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <svg width="340" height="420" viewBox="0 0 340 420" fill="none"
        style={{ animation: 'toriiBreath 5s ease-in-out infinite' }}>
        {/* 笠木（上の横木） */}
        <rect x="10" y="60" width="320" height="18" rx="4" fill={color} />
        {/* 貫（2段目横木） */}
        <rect x="40" y="100" width="260" height="12" rx="3" fill={color} />
        {/* 左柱 */}
        <rect x="60" y="108" width="22" height="312" rx="6" fill={color} />
        {/* 右柱 */}
        <rect x="258" y="108" width="22" height="312" rx="6" fill={color} />
        {/* 嶋木（上に伸びる棒） */}
        <rect x="145" y="10" width="14" height="54" rx="3" fill={color} />
        {/* 左島木 */}
        <rect x="58" y="40" width="14" height="24" rx="3" fill={color} />
        {/* 右島木 */}
        <rect x="268" y="40" width="14" height="24" rx="3" fill={color} />
      </svg>
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

// ── カード1枚専用 管理パネル ─────────────────────────
function CardAdminPanel({ uuid, onClose, onSaved }: { uuid: string; onClose: () => void; onSaved?: (url: string) => void }) {
  const cardUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?uuid=${uuid}`
    : `https://omikuji-app-ten.vercel.app/?uuid=${uuid}`

  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState('')
  const [inputUrl, setInputUrl] = useState('')
  const [label, setLabel] = useState('')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch(`/api/redirect?uuid=${encodeURIComponent(uuid)}`)
      .then(r => r.json())
      .then(d => {
        setRedirectUrl(d.url || '')
        setInputUrl(d.url || '')
        setLabel(d.label || '')
      })
      .catch(() => {})
  }, [uuid])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cardUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    if (!inputUrl) return
    setLoading(true)
    try {
      const r = await fetch('/api/redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', uuid, url: inputUrl, label, password }),
      })
      const d = await r.json()
      if (d.error) { setMsg('× ' + d.error) }
      else { setRedirectUrl(inputUrl); setSaved(true); setMsg('✓ 保存しました'); onSaved?.(inputUrl); setTimeout(() => { setSaved(false); setMsg('') }, 2500) }
    } catch { setMsg('× 通信エラー') }
    setLoading(false)
  }

  // パスワード認証画面
  if (!authed) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,10,30,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }} onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{
          background: '#fff', borderRadius: '18px', padding: '28px',
          width: '100%', maxWidth: '340px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: K.navy, margin: 0 }}>🔒 管理者ログイン</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#bbb', lineHeight: 1 }}>×</button>
          </div>
          {msg && (
            <div style={{ padding: '9px 12px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', background: '#fff0f0', color: '#cc2222' }}>{msg}</div>
          )}
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={async e => {
              if (e.key === 'Enter') {
                if (!password) { setMsg('× パスワードを入力してください'); return }
                setAuthLoading(true)
                const r = await fetch('/api/redirect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'auth', password }) })
                setAuthLoading(false)
                if (r.status === 401) setMsg('× パスワードが違います')
                else if (r.ok) setAuthed(true)
                else setMsg('× エラーが発生しました')
              }
            }}
            placeholder="パスワード"
            autoFocus
            style={{
              width: '100%', padding: '11px 13px', borderRadius: '9px',
              border: '1.5px solid #d0d8e8', fontSize: '14px',
              boxSizing: 'border-box', outline: 'none', marginBottom: '12px',
            }}
          />
          <button
            disabled={authLoading}
            onClick={async () => {
              if (!password) { setMsg('× パスワードを入力してください'); return }
              setAuthLoading(true)
              const r = await fetch('/api/redirect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'auth', password }) })
              setAuthLoading(false)
              if (r.status === 401) setMsg('× パスワードが違います')
              else if (r.ok) setAuthed(true)
              else setMsg('× エラーが発生しました')
            }}
            style={{
              width: '100%', padding: '12px', background: K.navy, color: '#fff',
              border: 'none', borderRadius: '9px', fontSize: '14px',
              fontWeight: '700', cursor: authLoading ? 'not-allowed' : 'pointer',
              opacity: authLoading ? 0.7 : 1,
            }}
          >
            {authLoading ? '確認中...' : 'ログイン'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,10,30,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: '18px', padding: '24px',
        width: '100%', maxWidth: '420px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: K.navy, margin: 0 }}>カード管理</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#bbb', lineHeight: 1 }}>×</button>
        </div>

        {msg && (
          <div style={{
            padding: '9px 12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px',
            background: msg.startsWith('✓') ? '#e6f9ee' : '#fff0f0',
            color: msg.startsWith('✓') ? '#1a8a50' : '#cc2222',
          }}>{msg}</div>
        )}

        {/* このカードのURL */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#6680aa', marginBottom: '8px', letterSpacing: '0.05em' }}>
            このカードのアクセスURL
          </p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
            <div style={{
              flex: 1, padding: '10px 12px',
              background: '#f0f4fc', borderRadius: '8px',
              fontSize: '11px', color: '#334', wordBreak: 'break-all',
              lineHeight: '1.6', cursor: 'pointer',
            }} onClick={handleCopy}>
              {cardUrl}
            </div>
            <button onClick={handleCopy} style={{
              flexShrink: 0, padding: '0 14px', borderRadius: '8px',
              border: '1.5px solid',
              borderColor: copied ? '#1a8a50' : '#ccd',
              background: copied ? '#e6f9ee' : '#fff',
              color: copied ? '#1a8a50' : '#555',
              cursor: 'pointer', fontSize: '12px', fontWeight: '700',
            }}>
              {copied ? '✓' : 'コピー'}
            </button>
          </div>
          <p style={{ fontSize: '10px', color: '#aaa', marginTop: '5px' }}>
            タップでもコピーできます。NFCカードをなくした場合はこのURLを直接共有してください。
          </p>
        </div>

        {/* リダイレクト先変更 */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#6680aa', marginBottom: '8px', letterSpacing: '0.05em' }}>
            リダイレクト先URL
          </p>
          <p style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>
            現在: {redirectUrl || '（読み込み中）'}
          </p>
          <input
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            placeholder="https://..."
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              border: '1.5px solid #d0d8e8', fontSize: '13px',
              boxSizing: 'border-box', outline: 'none', marginBottom: '10px',
            }}
          />
          <button onClick={handleSave} disabled={loading || !inputUrl} style={{
            width: '100%', padding: '11px',
            background: K.blue, color: '#fff',
            border: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: '700', cursor: 'pointer',
            opacity: loading || !inputUrl ? 0.6 : 1,
          }}>
            {loading ? '保存中...' : saved ? '✓ 保存しました' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OmikujiApp() {
  const [phase, setPhase] = useState<Phase>('shaking')
  const [fortune, setFortune] = useState(() => FORTUNES[Math.floor(Math.random() * FORTUNES.length)])
  const [stickNumber, setStickNumber] = useState(() => Math.floor(Math.random() * 20) + 1)
  const [luckyItem, setLuckyItem] = useState<string>(getLucky)
  const [showEffects, setShowEffects] = useState(false)
  const [shaking, setShaking] = useState(true)
  const [redirectUrl, setRedirectUrl] = useState('https://kataomoi.org')
  const [cardUuid, setCardUuid] = useState<string | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [tilting, setTilting] = useState(false)
  const [history, setHistory] = useState<FortuneRecord[]>([])
  const [selectedVideo, setSelectedVideo] = useState<string>(() => `/videos/0${Math.floor(Math.random() * 4) + 1}.mp4`)

  const isDaikichi = fortune.id === 'daikichi'
  const isKyo = fortune.id === 'kyo'

  // 履歴ロード
  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  // URLパラメータからuuidを取得してリダイレクトURL取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const uuid = params.get('uuid') || params.get('cardId')
    if (uuid) {
      setCardUuid(uuid)
      fetch(`/api/redirect?uuid=${encodeURIComponent(uuid)}`)
        .then(r => r.json())
        .then(d => { if (d.url) setRedirectUrl(d.url) })
        .catch(() => {})
    }
    // uuidなし = デフォルトURL（kataomoi.org）のまま
  }, [])

  // 結果確定時に履歴保存
  useEffect(() => {
    if (phase !== 'result') return
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const record: FortuneRecord = {
      id: fortune.id,
      result: fortune.result,
      resultColor: fortune.resultColor,
      stickNumber,
      luckyItem,
      date: `${now.getMonth() + 1}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
    }
    const next = saveHistory(record)
    setHistory(next)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // 結果表示後3秒待ってからカウントダウン開始→リダイレクト（管理画面が開いている間は停止）
  useEffect(() => {
    if (phase !== 'result') return
    if (showAdmin) {
      // 管理中はカウント停止
      if (countdownDelayRef.current) clearTimeout(countdownDelayRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
      setCountdown(null)
      return
    }
    // 結果描画完了後3秒待ってからカウントダウン開始
    countdownDelayRef.current = setTimeout(() => {
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
    }, 3000)
    return () => {
      if (countdownDelayRef.current) clearTimeout(countdownDelayRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [phase, redirectUrl, showAdmin])

  useEffect(() => {
    if (phase === 'shaking') {
      setShaking(true)
      setTilting(false)
    }
  }, [phase])

  // 初回マウント時のみplay()を試みる（ジェスチャー不要の環境向け）
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.warn('[omikuji] initial video play failed (expected on iOS):', err)
      })
    }
  }, [])

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
    const newVideo = `/videos/0${Math.floor(Math.random() * 4) + 1}.mp4`
    setShowEffects(false)
    setShaking(false)
    setTilting(false)
    setFortune(FORTUNES[Math.floor(Math.random() * FORTUNES.length)])
    setStickNumber(Math.floor(Math.random() * 20) + 1)
    setLuckyItem(getLucky())
    setSelectedVideo(newVideo)
    // iOS対応: ユーザージェスチャーのコンテキスト内で同期的にplay()
    if (videoRef.current) {
      videoRef.current.src = newVideo
      videoRef.current.load()
      videoRef.current.play().catch(err => console.warn('[omikuji] video play failed:', err))
    }
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

          {/* シャカシャカ & 棒が出るシーン — display:noneでDOMに常駐させiOSのautoplay制限を回避 */}
          <div style={{
            display: (phase === 'shaking' || phase === 'stick') ? 'block' : 'none',
            textAlign: 'center',
            animation: 'fadeInUp 0.5s ease forwards',
            width: '100%',
          }}>
            {/* 3D シーンコンテナ — 縦型（9:16）*/}
            <div style={{
              aspectRatio: '9/16',
              height: 'min(85vh, 620px)',
              width: 'auto',
              maxWidth: 'min(100%, calc(min(85vh, 620px) * 9 / 16))',
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

              {/* 動画アニメーション — 再生終了で結果へ遷移 */}
              <video
                ref={videoRef}
                src={selectedVideo}
                playsInline
                onEnded={() => {
                  setTilting(false)
                  setPhase('result')
                  setTimeout(() => setShowEffects(true), 500)
                }}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>

            {/* 管理ボタン */}
            <button
              onClick={() => setShowAdmin(true)}
              style={{ marginTop: '14px', padding: '6px 16px', fontSize: '11px', background: 'transparent', color: 'rgba(100,130,180,0.5)', border: '1px solid rgba(100,130,180,0.2)', borderRadius: '6px', cursor: 'pointer', letterSpacing: '0.1em' }}
            >⚙ 管理</button>
          </div>

          {/* 結果 */}
          {isResult && (
            <div style={{
              animation: 'flashReveal 0.8s ease forwards',
              width: '100%', maxWidth: '400px',
              position: 'relative', zIndex: 2,
              padding: '0 0 20px',
            }}>
              {/* 鳥居シルエット */}
              <ToriiSilhouette color={isKyo ? '#8090a8' : fortune.resultColor} />

              {/* 背景パーティクル */}
              {showEffects && <BgParticles color={isDaikichi ? 'rgba(255,210,0,0.7)' : isKyo ? 'rgba(100,130,180,0.5)' : `${fortune.resultColor}99`} />}

              {/* 番号 */}
              <p style={{
                textAlign: 'center', fontSize: '11px', fontWeight: '600',
                letterSpacing: '0.45em', marginBottom: '10px',
                color: isKyo ? 'rgba(160,180,210,0.4)' : `${fortune.accent}60`,
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
                animation: 'textFadeIn 0.6s ease 0.2s both',
              }}>— {stickNumber} 番 —</p>

              {/* 運勢文字（墨滲み演出） */}
              <div style={{
                textAlign: 'center',
                fontSize: 'clamp(88px, 26vw, 128px)',
                fontWeight: '900',
                color: fortune.resultColor,
                lineHeight: 1,
                marginBottom: '4px',
                animation: `inkBloom 0.9s cubic-bezier(0.2,0.8,0.3,1) 0.1s both, ${fortune.shimmer} 3s ease-in-out 1s infinite`,
                fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', 'Georgia', serif",
                position: 'relative', zIndex: 2,
              }}>{fortune.result}</div>

              <p style={{
                textAlign: 'center', fontSize: '11px', letterSpacing: '0.5em',
                marginBottom: '24px',
                color: isKyo ? 'rgba(160,180,210,0.4)' : `${fortune.accent}60`,
                animation: 'textFadeIn 0.6s ease 0.8s both',
              }}>{fortune.reading}</p>

              {/* 掛け軸カード */}
              <div style={{
                position: 'relative', zIndex: 2,
                background: fortune.cardBg,
                borderRadius: '3px 3px 60px 60px / 3px 3px 30px 30px',
                padding: '28px 24px 32px',
                marginBottom: '16px',
                backdropFilter: 'blur(20px)',
                boxShadow: isDaikichi
                  ? '0 8px 40px rgba(200,150,0,0.2), 0 2px 0 rgba(200,150,0,0.3) inset'
                  : isKyo
                  ? '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(100,120,160,0.15) inset'
                  : `0 8px 40px ${fortune.accent}20`,
                border: `1px solid ${fortune.cardBorder}60`,
                animation: 'scrollUnroll 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s both',
                overflow: 'hidden',
              }}>
                {/* 上部装飾ライン */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                  background: isDaikichi
                    ? 'linear-gradient(90deg, transparent, #f0c030, #ffe060, #f0c030, transparent)'
                    : isKyo
                    ? 'linear-gradient(90deg, transparent, #506070, #7090a8, #506070, transparent)'
                    : `linear-gradient(90deg, transparent, ${fortune.cardBorder}, transparent)`,
                }} />

                {/* メッセージ */}
                <p style={{
                  fontSize: '15px', lineHeight: '2.0',
                  color: isKyo ? 'rgba(200,215,235,0.9)' : fortune.accent,
                  marginBottom: '24px',
                  textAlign: 'center',
                  fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif",
                  animation: 'textFadeIn 0.8s ease 0.9s both',
                  letterSpacing: '0.06em',
                }}>{fortune.message}</p>

                {/* お守りアイテム */}
                <div style={{ textAlign: 'center', animation: 'itemReveal 0.6s ease 1.1s both' }}>
                  <p style={{
                    fontSize: '9px', fontWeight: '700', letterSpacing: '0.5em',
                    color: isKyo ? 'rgba(140,165,200,0.5)' : `${fortune.accent}60`,
                    marginBottom: '10px',
                    fontFamily: "'Helvetica Neue', Arial, sans-serif",
                  }}>TODAY'S CHARM</p>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '12px 28px',
                    background: isDaikichi
                      ? 'rgba(255,220,40,0.10)'
                      : isKyo
                      ? 'rgba(60,80,110,0.4)'
                      : `${fortune.accent}0f`,
                    borderRadius: '40px',
                    border: `1px solid ${fortune.cardBorder}50`,
                  }}>
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: fortune.resultColor, opacity: 0.7, flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: '19px', fontWeight: '700',
                      color: isKyo ? 'rgba(195,210,230,0.9)' : fortune.resultColor,
                      fontFamily: "'Hiragino Sans', sans-serif",
                      letterSpacing: '0.05em',
                    }}>{luckyItem}</span>
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: fortune.resultColor, opacity: 0.7, flexShrink: 0,
                    }} />
                  </div>
                </div>

                {/* 下部装飾ライン */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px',
                  background: isDaikichi
                    ? 'linear-gradient(90deg, transparent, #f0c030, #ffe060, #f0c030, transparent)'
                    : isKyo
                    ? 'linear-gradient(90deg, transparent, #506070, #7090a8, #506070, transparent)'
                    : `linear-gradient(90deg, transparent, ${fortune.cardBorder}, transparent)`,
                }} />
              </div>

              {/* 履歴 */}
              {history.length > 1 && (
                <div style={{
                  position: 'relative', zIndex: 2,
                  marginBottom: '14px',
                  padding: '12px 16px',
                  background: isKyo ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.035)',
                  borderRadius: '12px',
                  border: `1px solid ${isKyo ? 'rgba(100,130,170,0.12)' : fortune.cardBorder + '30'}`,
                }}>
                  <p style={{
                    fontSize: '9px', fontWeight: '700', letterSpacing: '0.4em',
                    color: isKyo ? 'rgba(160,185,215,0.4)' : `${fortune.accent}60`,
                    marginBottom: '10px',
                    fontFamily: "'Helvetica Neue', Arial, sans-serif",
                  }}>HISTORY</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {history.slice(1, 6).map((rec, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        animation: `histFadeIn 0.4s ease ${i * 0.07}s both`,
                      }}>
                        <span style={{ fontSize: '10px', color: isKyo ? 'rgba(160,185,215,0.35)' : 'rgba(80,100,130,0.4)', minWidth: '52px', letterSpacing: '0.02em' }}>{rec.date}</span>
                        <span style={{ fontWeight: '800', color: rec.resultColor, minWidth: '28px', fontSize: '13px', fontFamily: 'serif' }}>{rec.result}</span>
                        <span style={{ fontSize: '11px', color: isKyo ? 'rgba(160,185,215,0.5)' : 'rgba(80,100,130,0.55)', flex: 1, textAlign: 'right', letterSpacing: '0.03em' }}>{rec.luckyItem}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* もう一度ボタン */}
              <button
                onClick={handleReset}
                style={{
                  display: 'block', width: '100%', padding: '15px',
                  fontSize: '14px', fontWeight: '700',
                  letterSpacing: '0.25em',
                  background: isKyo
                    ? 'linear-gradient(135deg, #1e2a40, #2a3a54)'
                    : `linear-gradient(135deg, ${K.navy}, #1a3a70)`,
                  color: K.white, border: 'none', borderRadius: '12px',
                  cursor: 'pointer', transition: 'all 0.25s',
                  boxShadow: isKyo ? '0 4px 16px rgba(0,0,0,0.4)' : `0 4px 20px ${K.navy}60`,
                  fontFamily: "'Hiragino Sans', sans-serif",
                  position: 'relative', zIndex: 2,
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                もう一度引く
              </button>

              {/* カウントダウン */}
              {countdown !== null && countdown > 0 && (
                <p style={{ textAlign: 'center', fontSize: '11px', color: isKyo ? 'rgba(160,185,215,0.4)' : `${fortune.accent}60`, marginTop: '10px', letterSpacing: '0.15em' }}>
                  {countdown}秒後に移動します
                </p>
              )}

              {/* 管理ボタン */}
              <button
                onClick={() => setShowAdmin(true)}
                style={{ display: 'block', width: '100%', marginTop: '8px', padding: '8px', fontSize: '11px', background: 'transparent', color: 'rgba(100,130,180,0.35)', border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer', letterSpacing: '0.1em', position: 'relative', zIndex: 2 }}
              >⚙ 管理</button>
            </div>
          )}
        </main>

        {/* 右下：名刺購入ボタン */}
        <a
          href="https://kataomoi.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed', bottom: '20px', right: '16px',
            padding: '10px 16px',
            background: K.navy,
            color: K.white,
            fontSize: '12px', fontWeight: '700',
            borderRadius: '24px',
            textDecoration: 'none',
            letterSpacing: '0.05em',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', gap: '6px',
            zIndex: 30,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="14" rx="2"/>
            <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          </svg>
          このカードを購入する
        </a>
      </div>

      {/* カード管理画面（uuid付きアクセス時のみ表示） */}
      {showAdmin && <CardAdminPanel uuid={cardUuid || ""} onClose={() => setShowAdmin(false)} onSaved={(url) => { setRedirectUrl(url); setShowAdmin(false) }} />}
    </>
  )
}
