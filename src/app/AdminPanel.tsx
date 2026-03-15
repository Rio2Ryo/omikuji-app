'use client'

import { useState, useEffect, useCallback } from 'react'

const K = {
  navy: '#0f1f3d',
  blue: '#1e5a9f',
  light: '#84acfc',
  white: '#ffffff',
}

interface Config {
  default: string
  cards: Record<string, string>
  updatedAt: string
}

interface AdminPanelProps {
  onClose: () => void
}

const CARD_IDS = Array.from({ length: 20 }, (_, i) => String(i + 1))

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  // 個別編集
  const [editCard, setEditCard] = useState<string | null>(null)
  const [editUrl, setEditUrl] = useState('')

  // 一括設定
  const [bulkUrl, setBulkUrl] = useState('')
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState<'all' | 'select'>('all')

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const loadConfig = useCallback(async () => {
    const r = await fetch('/api/redirect')
    const d = await r.json()
    setConfig(d)
  }, [])

  const handleAuth = () => {
    if (password === 'kataomoi2025') { setAuthed(true); loadConfig() }
    else setAuthError('パスワードが違います')
  }

  const post = async (body: object) => {
    setLoading(true)
    const r = await fetch('/api/redirect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, password }),
    })
    const d = await r.json()
    setLoading(false)
    if (d.ok) { setConfig(d); return true }
    showMsg('× ' + (d.error || '失敗'))
    return false
  }

  const handleSetDefault = async () => {
    if (!editUrl) return
    const ok = await post({ action: 'setDefault', url: editUrl })
    if (ok) { showMsg('✓ デフォルトURLを更新しました'); setEditCard(null); setEditUrl('') }
  }

  const handleSetCard = async (cardId: string) => {
    const ok = await post({ action: 'setCard', cardId, url: editUrl })
    if (ok) { showMsg(`✓ カード${cardId}を更新しました`); setEditCard(null); setEditUrl('') }
  }

  const handleBulk = async () => {
    if (!bulkUrl) return
    if (bulkMode === 'all') {
      const ok = await post({ action: 'setAll', url: bulkUrl })
      if (ok) showMsg('✓ 全カードを一括設定しました')
    } else {
      if (bulkSelected.size === 0) { showMsg('× カードを選択してください'); return }
      const ok = await post({ action: 'setAll', url: bulkUrl, cardIds: Array.from(bulkSelected) })
      if (ok) showMsg(`✓ ${bulkSelected.size}枚のカードを設定しました`)
    }
    setBulkUrl(''); setBulkSelected(new Set())
  }

  const toggleSelect = (id: string) => {
    const s = new Set(bulkSelected)
    s.has(id) ? s.delete(id) : s.add(id)
    setBulkSelected(s)
  }

  const getCardUrl = (id: string) => config?.cards[id] || config?.default || ''

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: '6px',
    border: '1px solid #d0d8e8', fontSize: '13px',
    boxSizing: 'border-box', outline: 'none',
  }
  const btnStyle = (primary = true): React.CSSProperties => ({
    padding: '9px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
    fontSize: '13px', fontWeight: '600',
    background: primary ? K.blue : '#f0f4f8',
    color: primary ? K.white : '#333',
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,10,30,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: K.white, borderRadius: '16px', padding: '24px',
        width: '100%', maxWidth: '480px',
        maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: K.navy, margin: 0 }}>管理画面</h2>
            <p style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>リダイレクトURL設定</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888', padding: '4px 8px' }}>×</button>
        </div>

        {/* 認証 */}
        {!authed ? (
          <div>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              placeholder="管理者パスワード"
              style={{ ...inputStyle, marginBottom: '10px' }}
              autoFocus
            />
            {authError && <p style={{ color: '#e44', fontSize: '12px', marginBottom: '8px' }}>{authError}</p>}
            <button onClick={handleAuth} style={{ ...btnStyle(), width: '100%' }}>ログイン</button>
          </div>
        ) : (
          <div>
            {msg && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', background: msg.startsWith('✓') ? '#e8f8f0' : '#fff0f0', color: msg.startsWith('✓') ? '#2a8' : '#e44' }}>
                {msg}
              </div>
            )}

            {/* デフォルトURL */}
            <section style={{ marginBottom: '20px', padding: '14px', background: '#f8faff', borderRadius: '10px', border: '1px solid #e0e8f4' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: K.navy, marginBottom: '10px' }}>デフォルトURL（全カード共通）</h3>
              <p style={{ fontSize: '11px', color: '#888', marginBottom: '8px', wordBreak: 'break-all' }}>現在: {config?.default}</p>
              {editCard === 'default' ? (
                <>
                  <input value={editUrl} onChange={e => setEditUrl(e.target.value)} placeholder="https://..." style={{ ...inputStyle, marginBottom: '8px' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleSetDefault} style={btnStyle()} disabled={loading}>保存</button>
                    <button onClick={() => { setEditCard(null); setEditUrl('') }} style={btnStyle(false)}>キャンセル</button>
                  </div>
                </>
              ) : (
                <button onClick={() => { setEditCard('default'); setEditUrl(config?.default || '') }} style={btnStyle(false)}>変更</button>
              )}
            </section>

            {/* 一括設定 */}
            <section style={{ marginBottom: '20px', padding: '14px', background: '#f8faff', borderRadius: '10px', border: '1px solid #e0e8f4' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: K.navy, marginBottom: '10px' }}>一括設定</h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <button onClick={() => setBulkMode('all')} style={{ ...btnStyle(bulkMode === 'all'), flex: 1, padding: '7px' }}>全カード</button>
                <button onClick={() => setBulkMode('select')} style={{ ...btnStyle(bulkMode === 'select'), flex: 1, padding: '7px' }}>複数選択</button>
              </div>

              {bulkMode === 'select' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '10px' }}>
                  {CARD_IDS.map(id => (
                    <button key={id} onClick={() => toggleSelect(id)} style={{
                      padding: '6px 4px', borderRadius: '6px', border: '2px solid',
                      borderColor: bulkSelected.has(id) ? K.blue : '#d0d8e8',
                      background: bulkSelected.has(id) ? '#e8f0ff' : '#fff',
                      fontSize: '12px', fontWeight: bulkSelected.has(id) ? '700' : '400',
                      color: bulkSelected.has(id) ? K.blue : '#666',
                      cursor: 'pointer',
                    }}>
                      {id}
                      {config?.cards[id] ? <span style={{ display: 'block', fontSize: '8px', color: '#2a8' }}>●</span> : null}
                    </button>
                  ))}
                  <button onClick={() => setBulkSelected(new Set(CARD_IDS))} style={{ ...btnStyle(false), padding: '6px 4px', fontSize: '11px', gridColumn: 'span 2' }}>全選択</button>
                  <button onClick={() => setBulkSelected(new Set())} style={{ ...btnStyle(false), padding: '6px 4px', fontSize: '11px', gridColumn: 'span 3' }}>選択解除</button>
                </div>
              )}

              <input value={bulkUrl} onChange={e => setBulkUrl(e.target.value)} placeholder="https://..." style={{ ...inputStyle, marginBottom: '8px' }} />
              <button onClick={handleBulk} style={{ ...btnStyle(), width: '100%' }} disabled={loading}>
                {bulkMode === 'all' ? '全カードに設定' : `選択した${bulkSelected.size}枚に設定`}
              </button>
            </section>

            {/* 個別設定 */}
            <section style={{ padding: '14px', background: '#f8faff', borderRadius: '10px', border: '1px solid #e0e8f4' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: K.navy, marginBottom: '10px' }}>カード個別設定</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {CARD_IDS.map(id => (
                  <div key={id} style={{ padding: '10px 12px', background: '#fff', borderRadius: '8px', border: '1px solid #e4eaf4' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: K.navy }}>カード #{id}</span>
                        {config?.cards[id] && <span style={{ fontSize: '10px', color: '#2a8', marginLeft: '6px' }}>カスタム設定済</span>}
                        <p style={{ fontSize: '10px', color: '#888', margin: '2px 0 0', wordBreak: 'break-all', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getCardUrl(id)}
                        </p>
                      </div>
                      <button onClick={() => { setEditCard(id); setEditUrl(config?.cards[id] || config?.default || '') }} style={{ ...btnStyle(false), padding: '5px 10px', fontSize: '11px', flexShrink: 0 }}>
                        変更
                      </button>
                    </div>
                    {editCard === id && (
                      <div style={{ marginTop: '8px' }}>
                        <input value={editUrl} onChange={e => setEditUrl(e.target.value)} placeholder="https://..." style={{ ...inputStyle, marginBottom: '6px' }} autoFocus />
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleSetCard(id)} style={{ ...btnStyle(), flex: 1 }} disabled={loading}>保存</button>
                          <button onClick={() => { setEditCard(null); setEditUrl('') }} style={{ ...btnStyle(false), flex: 1 }}>キャンセル</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
