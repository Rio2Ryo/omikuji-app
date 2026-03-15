import { NextResponse } from 'next/server'

export const runtime = 'edge'

export interface RedirectConfig {
  default: string
  cards: Record<string, string>
  updatedAt: string
}

// デフォルト設定
const DEFAULT_CONFIG: RedirectConfig = {
  default: 'https://kataomoi.org',
  cards: {},
  updatedAt: new Date().toISOString(),
}

// インメモリキャッシュ（サーバー再起動で消えるが、Vercelではインスタンスごとに持つ）
// 本番環境では Vercel KV や Upstash Redis への移行を推奨
let memoryConfig: RedirectConfig = { ...DEFAULT_CONFIG }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cardId = searchParams.get('cardId')

  if (cardId) {
    const url = memoryConfig.cards[cardId] || memoryConfig.default
    return NextResponse.json({ url, cardId, isCustom: !!memoryConfig.cards[cardId] })
  }
  return NextResponse.json(memoryConfig)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { password } = body
  if (password !== 'kataomoi2025') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const config = { ...memoryConfig }

  if (body.action === 'setAll') {
    try { new URL(body.url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
    if (body.cardIds && Array.isArray(body.cardIds)) {
      for (const id of body.cardIds) config.cards[id] = body.url
    } else {
      config.default = body.url
      config.cards = {}
    }
    config.updatedAt = new Date().toISOString()
    memoryConfig = config
    return NextResponse.json({ ok: true, ...config })
  }

  if (body.action === 'setCard') {
    try { new URL(body.url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
    config.cards = { ...config.cards, [body.cardId]: body.url }
    config.updatedAt = new Date().toISOString()
    memoryConfig = config
    return NextResponse.json({ ok: true, ...config })
  }

  if (body.action === 'setDefault') {
    try { new URL(body.url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
    config.default = body.url
    config.updatedAt = new Date().toISOString()
    memoryConfig = config
    return NextResponse.json({ ok: true, ...config })
  }

  if (body.action === 'deleteCards') {
    for (const id of (body.cardIds || [])) delete config.cards[id]
    config.updatedAt = new Date().toISOString()
    memoryConfig = config
    return NextResponse.json({ ok: true, ...config })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
