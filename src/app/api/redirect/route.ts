import { NextResponse } from 'next/server'

// GitHub Gist に設定を永続化
const GIST_ID = process.env.GIST_ID || 'ce9cf1397fb046ba55adfe6c03c34171'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const GIST_FILE = 'redirect-config.json'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'kataomoi2025'

export interface CardConfig {
  uuid: string
  label: string       // 管理用ラベル（例：「春キャンペーンA」）
  url: string
  createdAt: string
  group?: string      // グループ名（例：「イベントA」「店舗B」）
  theme?: string      // テーマID（例：「default」「ivision」）
}

export interface RedirectConfig {
  cards: Record<string, CardConfig>  // uuid -> CardConfig
  updatedAt: string
  groupThemes?: Record<string, string>
}

const DEFAULT_CONFIG: RedirectConfig = {
  cards: {},
  updatedAt: new Date().toISOString(),
  groupThemes: {},
}

// インメモリキャッシュ（頻繁なGist APIコール回避）
let cache: { config: RedirectConfig; fetchedAt: number } | null = null
const CACHE_TTL = 0 // キャッシュなし（常に最新をGistから取得）

async function fetchConfig(): Promise<RedirectConfig> {
  // キャッシュ有効なら使う
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.config
  }
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      next: { revalidate: 0 },
    })
    if (!res.ok) throw new Error(`Gist fetch failed: ${res.status}`)
    const data = await res.json()
    const content = data.files?.[GIST_FILE]?.content
    if (!content) throw new Error('No config file in gist')
    const config = JSON.parse(content) as RedirectConfig
    cache = { config, fetchedAt: Date.now() }
    return config
  } catch (e) {
    console.error('fetchConfig error:', e)
    return DEFAULT_CONFIG
  }
}

async function saveConfig(config: RedirectConfig): Promise<boolean> {
  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [GIST_FILE]: { content: JSON.stringify(config, null, 2) },
        },
      }),
    })
    if (!res.ok) throw new Error(`Gist save failed: ${res.status}`)
    // キャッシュ更新
    cache = { config, fetchedAt: Date.now() }
    return true
  } catch (e) {
    console.error('saveConfig error:', e)
    return false
  }
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// GET /api/redirect?uuid=xxx  → そのカードのURLを返す
// GET /api/redirect            → 全設定を返す
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const uuid = searchParams.get('uuid') || searchParams.get('cardId')
  const config = await fetchConfig()

  if (uuid) {
    const card = config.cards[uuid]
    if (!card) {
      return NextResponse.json({ error: 'Card not found', uuid }, { status: 404 })
    }
    const groupTheme = card.group && config.groupThemes?.[card.group]
    const theme = card.theme || groupTheme || 'default'
    return NextResponse.json({ url: card.url, uuid, label: card.label, theme })
  }
  return NextResponse.json(config)
}

export async function POST(request: Request) {
  const body = await request.json()

  // UUID所有者による自己更新は認証免除（UUID = アクセスキー）
  const isOwnerUpdate = body.action === 'update' && typeof body.uuid === 'string' && !body.password

  // パスワード認証（オーナー更新以外）
  if (!isOwnerUpdate && body.password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // パスワード確認のみ: { action: 'auth' }
  if (body.action === 'auth') {
    return NextResponse.json({ ok: true })
  }

  const config = await fetchConfig()

  // 新規カード発行: { action: 'create', label, url, group? }
  if (body.action === 'create') {
    try { new URL(body.url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
    const uuid = generateUUID()
    config.cards[uuid] = {
      uuid,
      label: body.label || `カード ${Object.keys(config.cards).length + 1}`,
      url: body.url,
      createdAt: new Date().toISOString(),
      ...(body.group ? { group: body.group } : {}),
      ...(body.theme ? { theme: body.theme } : {}),
    }
    config.updatedAt = new Date().toISOString()
    const ok = await saveConfig(config)
    return NextResponse.json({ ok, ...config.cards[uuid], uuid })
  }

  // 一括カード発行: { action: 'bulkCreate', count, url, group? }
  if (body.action === 'bulkCreate') {
    const count = Math.max(1, Math.min(100, Number(body.count) || 1))
    try { new URL(body.url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
    const now = new Date().toISOString()
    const created: CardConfig[] = []
    const base = Object.keys(config.cards).length
    for (let i = 0; i < count; i++) {
      const uuid = generateUUID()
      const card: CardConfig = {
        uuid,
        label: body.group ? `${body.group} #${base + i + 1}` : `カード ${base + i + 1}`,
        url: body.url,
        createdAt: now,
        ...(body.group ? { group: body.group } : {}),
      }
      config.cards[uuid] = card
      created.push(card)
    }
    config.updatedAt = now
    const ok = await saveConfig(config)
    return NextResponse.json({ ok, count: created.length, cards: created })
  }

  // カード更新: { action: 'update', uuid, label?, url? }
  if (body.action === 'update') {
    if (!config.cards[body.uuid]) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }
    if (body.url) {
      try { new URL(body.url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
      config.cards[body.uuid].url = body.url
    }
    if (body.label !== undefined) config.cards[body.uuid].label = body.label
    if (body.group !== undefined) config.cards[body.uuid].group = body.group || undefined
    if (body.theme !== undefined) config.cards[body.uuid].theme = body.theme || undefined
    config.updatedAt = new Date().toISOString()
    const ok = await saveConfig(config)
    return NextResponse.json({ ok, ...config.cards[body.uuid] })
  }

  // カード削除: { action: 'delete', uuid }
  if (body.action === 'delete') {
    if (!config.cards[body.uuid]) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }
    delete config.cards[body.uuid]
    config.updatedAt = new Date().toISOString()
    const ok = await saveConfig(config)
    return NextResponse.json({ ok })
  }

  // 一括URL更新: { action: 'bulkUpdate', uuids: string[], url }
  if (body.action === 'bulkUpdate') {
    try { new URL(body.url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
    for (const uuid of (body.uuids || [])) {
      if (config.cards[uuid]) config.cards[uuid].url = body.url
    }
    config.updatedAt = new Date().toISOString()
    const ok = await saveConfig(config)
    return NextResponse.json({ ok, ...config })
  }

  // グループテーマ設定: { action: 'setGroupTheme', group: string, theme: string }
  if (body.action === 'setGroupTheme') {
    if (!body.group) return NextResponse.json({ error: 'group is required' }, { status: 400 })
    if (!config.groupThemes) config.groupThemes = {}
    if (body.theme) {
      config.groupThemes[body.group] = body.theme
    } else {
      delete config.groupThemes[body.group]
    }
    config.updatedAt = new Date().toISOString()
    const ok = await saveConfig(config)
    return NextResponse.json({ ok, groupThemes: config.groupThemes })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
