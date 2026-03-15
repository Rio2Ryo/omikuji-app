import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const CONFIG_PATH = join(process.cwd(), 'redirect-config.json')

export interface RedirectConfig {
  default: string
  cards: Record<string, string>  // cardId -> url
  updatedAt: string
}

function getConfig(): RedirectConfig {
  if (!existsSync(CONFIG_PATH)) {
    const d: RedirectConfig = { default: 'https://kataomoi.org', cards: {}, updatedAt: new Date().toISOString() }
    writeFileSync(CONFIG_PATH, JSON.stringify(d, null, 2))
    return d
  }
  const raw = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))
  // migrate legacy format
  if (typeof raw.url === 'string' && !raw.default) {
    return { default: raw.url, cards: {}, updatedAt: raw.updatedAt || new Date().toISOString() }
  }
  return { default: raw.default || 'https://kataomoi.org', cards: raw.cards || {}, updatedAt: raw.updatedAt }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cardId = searchParams.get('cardId')
  const config = getConfig()
  if (cardId) {
    const url = config.cards[cardId] || config.default
    return NextResponse.json({ url, cardId, isCustom: !!config.cards[cardId] })
  }
  return NextResponse.json(config)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { password } = body
  if (password !== 'kataomoi2025') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const config = getConfig()

  // 一括設定: { action: 'setAll', url, cardIds?: string[] }
  if (body.action === 'setAll') {
    try { new URL(body.url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
    if (body.cardIds && Array.isArray(body.cardIds)) {
      for (const id of body.cardIds) config.cards[id] = body.url
    } else {
      config.default = body.url
      config.cards = {}  // 全カードをデフォルトにリセット
    }
    config.updatedAt = new Date().toISOString()
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
    return NextResponse.json({ ok: true, ...config })
  }

  // 個別設定: { action: 'setCard', cardId, url } or { action: 'setDefault', url }
  if (body.action === 'setCard') {
    try { new URL(body.url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
    config.cards[body.cardId] = body.url
    config.updatedAt = new Date().toISOString()
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
    return NextResponse.json({ ok: true, ...config })
  }

  if (body.action === 'setDefault') {
    try { new URL(body.url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
    config.default = body.url
    config.updatedAt = new Date().toISOString()
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
    return NextResponse.json({ ok: true, ...config })
  }

  // 複数カード削除
  if (body.action === 'deleteCards') {
    for (const id of (body.cardIds || [])) delete config.cards[id]
    config.updatedAt = new Date().toISOString()
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
    return NextResponse.json({ ok: true, ...config })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
