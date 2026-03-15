import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const CONFIG_PATH = join(process.cwd(), 'redirect-config.json')

function getConfig() {
  if (!existsSync(CONFIG_PATH)) {
    const d = { url: 'https://kataomoi.org', updatedAt: new Date().toISOString() }
    writeFileSync(CONFIG_PATH, JSON.stringify(d))
    return d
  }
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))
}

export async function GET() {
  return NextResponse.json(getConfig())
}

export async function POST(request: Request) {
  const { url, password } = await request.json()
  if (password !== 'kataomoi2025') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try { new URL(url) } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }
  const config = { url, updatedAt: new Date().toISOString() }
  writeFileSync(CONFIG_PATH, JSON.stringify(config))
  return NextResponse.json({ ok: true, ...config })
}
