import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'おみくじ',
  description: '今日の運勢を占ってみよう',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
