import type { Theme } from './index'

// 渋谷愛ビジョン テーマ（Step 2で詳細デザイン予定）
export const ivisionTheme: Theme = {
  id: 'ivision',
  name: '渋谷愛ビジョン',
  video: '/videos/05.mp4', // Step 2で専用動画に差し替え予定
  fortunes: [
    {
      id: 'daikichi', result: '大吉', reading: 'だいきち',
      message: '渋谷から、最高の運気があなたへ届きます。',
      resultColor: '#e8a000',
      bg: 'linear-gradient(150deg, #1a0a00 0%, #3a2000 40%, #5a3500 100%)',
      cardBg: 'rgba(40,25,5,0.92)', cardBorder: '#e8a000',
      accent: '#ffcc44', shimmer: 'shimmerGold',
      anim: 'scaleIn 0.5s cubic-bezier(0.34,1.8,0.64,1) forwards',
    },
    {
      id: 'kichi', result: '吉', reading: 'きち',
      message: '渋谷の空気があなたを後押しする一日。',
      resultColor: '#4488ff',
      bg: 'linear-gradient(150deg, #000a1a 0%, #001830 100%)',
      cardBg: 'rgba(0,15,35,0.92)', cardBorder: '#2255cc',
      accent: '#4488ff', shimmer: 'shimmerBlue',
      anim: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
    },
    {
      id: 'chukichi', result: '中吉', reading: 'ちゅうきち',
      message: '街の灯りのように、着実に輝き続けよう。',
      resultColor: '#44cc88',
      bg: 'linear-gradient(150deg, #001510 0%, #002820 100%)',
      cardBg: 'rgba(0,20,15,0.92)', cardBorder: '#228855',
      accent: '#44cc88', shimmer: 'shimmerBlue',
      anim: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
    },
    {
      id: 'shokichi', result: '小吉', reading: 'しょうきち',
      message: 'ネオンのように、小さくても確かな光を放て。',
      resultColor: '#aa55ff',
      bg: 'linear-gradient(150deg, #0a0015 0%, #150030 100%)',
      cardBg: 'rgba(15,0,35,0.92)', cardBorder: '#7733cc',
      accent: '#aa55ff', shimmer: 'shimmerBlue',
      anim: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
    },
    {
      id: 'suekichi', result: '末吉', reading: 'すえきち',
      message: '渋谷の交差点のように、必ず出会いが来る。',
      resultColor: '#ff6688',
      bg: 'linear-gradient(150deg, #1a0008 0%, #300010 100%)',
      cardBg: 'rgba(30,0,12,0.92)', cardBorder: '#cc3355',
      accent: '#ff6688', shimmer: 'shimmerBlue',
      anim: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
    },
    {
      id: 'kyo', result: '凶', reading: 'きょう',
      message: '雨の渋谷も美しい。立ち止まる勇気を持て。',
      resultColor: '#667788',
      bg: 'linear-gradient(150deg, #050a10 0%, #080f18 100%)',
      cardBg: 'rgba(8,12,20,0.92)', cardBorder: '#334455',
      accent: '#8899aa', shimmer: 'shimmerGray',
      anim: 'sadDrop 0.6s cubic-bezier(0.22,1,0.36,1) forwards',
    },
  ],
  resultBg: 'linear-gradient(150deg, #020408 0%, #05080f 100%)',
}
