'use client'

import { useState, useEffect, useCallback } from 'react'

const K = {
  navy: '#0f1f3d',
  blue: '#1e5a9f',
  light: '#84acfc',
  white: '#ffffff',
}

interface CardConfig {
  uuid: string
  label: string
  url: string
  createdAt: string
}

interface Config {
  cards: Record<string, CardConfig>
  updatedAt: string
}

interface AdminPanelProps {
  onClose: () => void
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  // 新規カード作成フォーム
  const [newLabel, setNewLabel] = useState('')
  const [newUrl, setNewUrl] = useState('')

  // 編集中カード
  const [editUuid, setEditUuid] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editUrl, setEditUrl] = useState('')

  // 一括設定
  const [bulkUrl, setBulkUrl] = useState('')
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())

  // コピー済みUUID
  const [copiedUuid, setCopiedUuid] = useState<string | null>(null)

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const loadConfig = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/redirect')
    const d = await r.json()
    setConfig(d)
    setLoading(false)
  }, [])

  const handleAuth = async () => {
    if (password === 'kataomoi2025') {
      setAuthed(true)
      loadConfig()
    } else {
      setAuthError('パスワードが違います')
    }
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
    if (d.ok !== false && !d.error) return d
    showMsg('× ' + (d.error || '失敗'))
    return null
  }

  // 新規カード発行
  const handleCreate = async () => {
    if (!newUrl) { showMsg('× URLを入力してください'); return }
    const d = await post({ action: 'create', label: newLabel || undefined, url: newUrl })
    if (d) {
      showMsg(`✓ カード「${d.label}」を発行しました`)
      setNewLabel(''); setNewUrl('')
      loadConfig()
    }
  }

  // カード更新
  const handleUpdate = async (uuid: string) => {
    const d = await post({ action: 'update', uuid, label: editLabel, url: editUrl })
    if (d) {
      showMsg('✓ 更新しました')
      setEditUuid(null)
      loadConfig()
    }
  }

  // カード削除
  const handleDelete = async (uuid: string, label: string) => {
    if (!confirm(`「${label}」を削除しますか？`)) return
    const d = await post({ action: 'delete', uuid })
    if (d) {
      showMsg('✓ 削除しました')
      loadConfig()
    }
  }

  // 一括更新
  const handleBulk = async () => {
    if (!bulkUrl) { showMsg('× URLを入力してください'); return }
    if (bulkSelected.size === 0) { showMsg('× カードを選択してください'); return }
    const d = await post({ action: 'bulkUpdate', uuids: Array.from(bulkSelected), url: bulkUrl })
    if (d) {
      showMsg(`✓ ${bulkSelected.size}枚を更新しました`)
      setBulkUrl(''); setBulkSelected(new Set())
      loadConfig()
    }
  }

  // NFCに書くURLをコピー
  const copyNfcUrl = async (uuid: string) => {
    const nfcUrl = `${window.location.origin}/?uuid=${uuid}`
    await navigator.clipboard.writeText(nfcUrl)
    setCopiedUuid(uuid)
    setTimeout(() => setCopiedUuid(null), 2000)
  }

  const toggleSelect = (uuid: string) => {
    const s = new Set(bulkSelected)
    s.has(uuid) ? s.delete(uuid) : s.add(uuid)
    setBulkSelected(s)
  }

  const cards = config ? Object.values(config.cards).sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  ) : []

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: '6px',
    border: '1px solid #d0d8e8', fontSize: '13px',
    boxSizing: 'border-box', outline: 'none',
  }
  const btnPrimary: React.CSSProperties = {
    padding: '9px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
    fontSize: '13px', fontWeight: '600', background: K.blue, color: K.white,
  }
  const btnSecondary: React.CSSProperties = {
    padding: '9px 16px', borderRadius: '6px', border: '1px solid #d0d8e8',
    cursor: 'pointer', fontSize: '13px', fontWeight: '500',
    background: '#f8faff', color: '#333',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,10,30,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: K.white, borderRadius: '16px', padding: '24px',
        width: '100%', maxWidth: '520px',
        maxHeight: '88vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
      }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: K.navy, margin: 0 }}>NFC カード管理</h2>
            <p style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>カードごとにリダイレクトURLを設定</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#aaa', lineHeight: 1 }}>×</button>
        </div>

        {/* 認証 */}
        {!authed ? (
          <div>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              placeholder="管理者パスワード" style={{ ...inputStyle, marginBottom: '10px' }} autoFocus
            />
            {authError && <p style={{ color: '#e44', fontSize: '12px', marginBottom: '8px' }}>{authError}</p>}
            <button onClick={handleAuth} style={{ ...btnPrimary, width: '100%' }}>ログイン</button>
          </div>
        ) : (
          <div>
            {/* メッセージ */}
            {msg && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px',
                background: msg.startsWith('✓') ? '#e8f8f0' : '#fff0f0',
                color: msg.startsWith('✓') ? '#1a8a50' : '#cc2222',
              }}>{msg}</div>
            )}

            {/* 新規カード発行 */}
            <section style={{ marginBottom: '20px', padding: '16px', background: '#f0f6ff', borderRadius: '12px', border: '1px solid #ccd8f0' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: K.navy, marginBottom: '12px' }}>
                + 新規カード発行
              </h3>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                placeholder="ラベル（例：春キャンペーンA）" style={{ ...inputStyle, marginBottom: '8px' }} />
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)}
                placeholder="リダイレクト先URL（https://...）" style={{ ...inputStyle, marginBottom: '10px' }} />
              <button onClick={handleCreate} style={{ ...btnPrimary, width: '100%' }} disabled={loading}>
                {loading ? '処理中...' : 'UUID発行 & 保存'}
              </button>
            </section>

            {/* 一括更新 */}
            {cards.length > 0 && (
              <section style={{ marginBottom: '20px', padding: '16px', background: '#f8faff', borderRadius: '12px', border: '1px solid #e0e8f4' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: K.navy, marginBottom: '10px' }}>複数カード一括URL変更</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                  {cards.map(c => (
                    <button key={c.uuid} onClick={() => toggleSelect(c.uuid)} style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                      border: '1.5px solid',
                      borderColor: bulkSelected.has(c.uuid) ? K.blue : '#d0d8e8',
                      background: bulkSelected.has(c.uuid) ? '#e8f0ff' : '#fff',
                      color: bulkSelected.has(c.uuid) ? K.blue : '#555',
                      fontWeight: bulkSelected.has(c.uuid) ? '700' : '400',
                    }}>{c.label}</button>
                  ))}
                  <button onClick={() => setBulkSelected(new Set(cards.map(c => c.uuid)))}
                    style={{ ...btnSecondary, padding: '4px 10px', fontSize: '11px' }}>全選択</button>
                  <button onClick={() => setBulkSelected(new Set())}
                    style={{ ...btnSecondary, padding: '4px 10px', fontSize: '11px' }}>解除</button>
                </div>
                <input value={bulkUrl} onChange={e => setBulkUrl(e.target.value)}
                  placeholder="新しいURL（https://...）" style={{ ...inputStyle, marginBottom: '8px' }} />
                <button onClick={handleBulk} style={{ ...btnPrimary, width: '100%' }} disabled={loading || bulkSelected.size === 0}>
                  {bulkSelected.size > 0 ? `選択した${bulkSelected.size}枚を更新` : 'カードを選択してください'}
                </button>
              </section>
            )}

            {/* カード一覧 */}
            <section>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: K.navy, marginBottom: '10px' }}>
                発行済みカード {cards.length > 0 && <span style={{ color: '#888', fontWeight: '400' }}>（{cards.length}枚）</span>}
              </h3>
              {cards.length === 0 ? (
                <p style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                  まだカードがありません。上から発行してください。
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {cards.map((card, idx) => (
                    <div key={card.uuid} style={{
                      padding: '12px 14px', background: '#fff',
                      borderRadius: '10px', border: '1px solid #e4eaf4',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: '700', color: K.navy, margin: '0 0 2px' }}>
                            #{idx + 1} {card.label}
                          </p>
                          <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {card.url}
                          </p>
                          {/* NFCに書くURL */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <code style={{
                              fontSize: '9px', color: '#666', background: '#f0f4f8',
                              padding: '3px 6px', borderRadius: '4px',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              maxWidth: '200px', display: 'inline-block',
                            }}>
                              /?uuid={card.uuid.slice(0, 8)}...
                            </code>
                            <button onClick={() => copyNfcUrl(card.uuid)} style={{
                              padding: '3px 8px', fontSize: '10px', borderRadius: '4px',
                              border: '1px solid #ccd', background: copiedUuid === card.uuid ? '#e8f8f0' : '#fff',
                              color: copiedUuid === card.uuid ? '#1a8a50' : '#555',
                              cursor: 'pointer', flexShrink: 0,
                            }}>
                              {copiedUuid === card.uuid ? '✓ コピー済' : 'NFCにコピー'}
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button onClick={() => { setEditUuid(card.uuid); setEditLabel(card.label); setEditUrl(card.url) }}
                            style={{ ...btnSecondary, padding: '5px 10px', fontSize: '11px' }}>編集</button>
                          <button onClick={() => handleDelete(card.uuid, card.label)}
                            style={{ padding: '5px 10px', fontSize: '11px', borderRadius: '6px',
                              border: '1px solid #ffcccc', background: '#fff8f8', color: '#cc3333', cursor: 'pointer' }}>
                            削除
                          </button>
                        </div>
                      </div>

                      {/* 編集フォーム */}
                      {editUuid === card.uuid && (
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eef' }}>
                          <input value={editLabel} onChange={e => setEditLabel(e.target.value)}
                            placeholder="ラベル" style={{ ...inputStyle, marginBottom: '6px' }} autoFocus />
                          <input value={editUrl} onChange={e => setEditUrl(e.target.value)}
                            placeholder="URL（https://...）" style={{ ...inputStyle, marginBottom: '8px' }} />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleUpdate(card.uuid)} style={{ ...btnPrimary, flex: 1 }} disabled={loading}>保存</button>
                            <button onClick={() => setEditUuid(null)} style={{ ...btnSecondary, flex: 1 }}>キャンセル</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
