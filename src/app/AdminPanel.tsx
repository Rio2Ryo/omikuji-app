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
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  // 新規カード作成
  const [newLabel, setNewLabel] = useState('')
  const [newUrl, setNewUrl] = useState('')

  // 編集中
  const [editUuid, setEditUuid] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editUrl, setEditUrl] = useState('')

  // 一括設定
  const [bulkUrl, setBulkUrl] = useState('')
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())

  // コピー済み
  const [copiedUuid, setCopiedUuid] = useState<string | null>(null)

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/redirect')
      const d = await r.json()
      setConfig(d)
    } catch { showMsg('× 読み込みに失敗しました') }
    setLoading(false)
  }, [])

  useEffect(() => { loadConfig() }, [loadConfig])

  const post = async (body: object) => {
    setLoading(true)
    try {
      const r = await fetch('/api/redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      setLoading(false)
      if (d.error) { showMsg('× ' + d.error); return null }
      return d
    } catch {
      setLoading(false)
      showMsg('× 通信エラーが発生しました')
      return null
    }
  }

  const handleCreate = async () => {
    if (!newUrl) { showMsg('× URLを入力してください'); return }
    const d = await post({ action: 'create', label: newLabel || undefined, url: newUrl })
    if (d) {
      showMsg(`✓ カード「${d.label}」を発行しました`)
      setNewLabel(''); setNewUrl('')
      loadConfig()
    }
  }

  const handleUpdate = async (uuid: string) => {
    const d = await post({ action: 'update', uuid, label: editLabel, url: editUrl })
    if (d) {
      showMsg('✓ 更新しました')
      setEditUuid(null)
      loadConfig()
    }
  }

  const handleDelete = async (uuid: string, label: string) => {
    if (!confirm(`「${label}」を削除しますか？`)) return
    const d = await post({ action: 'delete', uuid })
    if (d) { showMsg('✓ 削除しました'); loadConfig() }
  }

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

  const copyUrl = async (text: string, uuid: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedUuid(uuid)
    setTimeout(() => setCopiedUuid(null), 2000)
  }

  const toggleSelect = (uuid: string) => {
    const s = new Set(bulkSelected)
    s.has(uuid) ? s.delete(uuid) : s.add(uuid)
    setBulkSelected(s)
  }

  const getNfcUrl = (uuid: string) =>
    `${typeof window !== 'undefined' ? window.location.origin : 'https://omikuji-app-ten.vercel.app'}/?uuid=${uuid}`

  const cards = config
    ? Object.values(config.cards).sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    : []

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 11px', borderRadius: '8px',
    border: '1px solid #d0d8e8', fontSize: '13px', boxSizing: 'border-box', outline: 'none',
  }
  const btnP: React.CSSProperties = {
    padding: '9px 16px', borderRadius: '8px', border: 'none',
    cursor: 'pointer', fontSize: '13px', fontWeight: '600',
    background: K.blue, color: K.white,
  }
  const btnS: React.CSSProperties = {
    padding: '9px 16px', borderRadius: '8px', border: '1px solid #d0d8e8',
    cursor: 'pointer', fontSize: '13px', fontWeight: '500',
    background: '#f8faff', color: '#333',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,10,30,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: K.white, borderRadius: '18px', padding: '24px',
        width: '100%', maxWidth: '520px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
      }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: K.navy, margin: 0 }}>NFC カード管理</h2>
            <p style={{ fontSize: '11px', color: '#999', marginTop: '3px' }}>カードごとにリダイレクトURLを設定・確認</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#bbb', lineHeight: 1, padding: '4px' }}>×</button>
        </div>

        {/* メッセージ */}
        {msg && (
          <div style={{
            padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px',
            background: msg.startsWith('✓') ? '#e6f9ee' : '#fff0f0',
            color: msg.startsWith('✓') ? '#1a8a50' : '#cc2222',
          }}>{msg}</div>
        )}

        {loading && !config && (
          <p style={{ textAlign: 'center', color: '#aaa', padding: '20px', fontSize: '13px' }}>読み込み中...</p>
        )}

        {config && (
          <>
            {/* 新規カード発行 */}
            <section style={{ marginBottom: '20px', padding: '16px', background: '#f0f6ff', borderRadius: '12px', border: '1px solid #ccd8f0' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: K.navy, marginBottom: '12px' }}>+ 新規カード発行</h3>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                placeholder="ラベル（例：春キャンペーンA）" style={{ ...inp, marginBottom: '8px' }} />
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)}
                placeholder="リダイレクト先URL（https://...）" style={{ ...inp, marginBottom: '10px' }} />
              <button onClick={handleCreate} style={{ ...btnP, width: '100%' }} disabled={loading}>
                UUID発行 & 保存
              </button>
            </section>

            {/* 一括変更 */}
            {cards.length > 1 && (
              <section style={{ marginBottom: '20px', padding: '16px', background: '#f8faff', borderRadius: '12px', border: '1px solid #e0e8f4' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: K.navy, marginBottom: '10px' }}>複数カード 一括URL変更</h3>
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
                    style={{ ...btnS, padding: '4px 10px', fontSize: '11px' }}>全選択</button>
                  <button onClick={() => setBulkSelected(new Set())}
                    style={{ ...btnS, padding: '4px 10px', fontSize: '11px' }}>解除</button>
                </div>
                <input value={bulkUrl} onChange={e => setBulkUrl(e.target.value)}
                  placeholder="新しいURL（https://...）" style={{ ...inp, marginBottom: '8px' }} />
                <button onClick={handleBulk} style={{ ...btnP, width: '100%' }} disabled={loading || bulkSelected.size === 0}>
                  {bulkSelected.size > 0 ? `選択した${bulkSelected.size}枚を更新` : 'カードを選択してください'}
                </button>
              </section>
            )}

            {/* カード一覧 */}
            <section>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: K.navy, marginBottom: '10px' }}>
                発行済みカード
                {cards.length > 0 && <span style={{ color: '#aaa', fontWeight: '400', marginLeft: '6px' }}>{cards.length}枚</span>}
              </h3>

              {cards.length === 0 ? (
                <p style={{ color: '#bbb', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
                  まだカードがありません。上から発行してください。
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cards.map((card, idx) => {
                    const nfcUrl = getNfcUrl(card.uuid)
                    return (
                      <div key={card.uuid} style={{
                        borderRadius: '12px', border: '1px solid #e4eaf4',
                        overflow: 'hidden', background: '#fff',
                      }}>
                        {/* カードヘッダー */}
                        <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: K.navy, margin: '0 0 3px' }}>
                              #{idx + 1} {card.label}
                            </p>
                            <p style={{ fontSize: '11px', color: '#888', margin: 0,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              → {card.url}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            <button
                              onClick={() => { setEditUuid(editUuid === card.uuid ? null : card.uuid); setEditLabel(card.label); setEditUrl(card.url) }}
                              style={{ ...btnS, padding: '5px 10px', fontSize: '11px' }}>
                              {editUuid === card.uuid ? '閉じる' : '編集'}
                            </button>
                            <button onClick={() => handleDelete(card.uuid, card.label)} style={{
                              padding: '5px 10px', fontSize: '11px', borderRadius: '6px',
                              border: '1px solid #fcc', background: '#fff8f8', color: '#c44', cursor: 'pointer',
                            }}>削除</button>
                          </div>
                        </div>

                        {/* NFCカードURL（常時表示） */}
                        <div style={{ padding: '10px 14px', background: '#f6f9ff', borderTop: '1px solid #edf0f8' }}>
                          <p style={{ fontSize: '10px', fontWeight: '600', color: '#6680aa', marginBottom: '5px', letterSpacing: '0.05em' }}>
                            NFCカードのURL（タップでコピー）
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <code style={{
                              flex: 1, fontSize: '11px', color: '#334',
                              background: '#edf1fb', padding: '6px 8px',
                              borderRadius: '6px', wordBreak: 'break-all',
                              lineHeight: '1.5', cursor: 'pointer',
                            }} onClick={() => copyUrl(nfcUrl, card.uuid)}>
                              {nfcUrl}
                            </code>
                            <button onClick={() => copyUrl(nfcUrl, card.uuid)} style={{
                              padding: '6px 10px', fontSize: '11px', borderRadius: '6px', flexShrink: 0,
                              border: '1px solid',
                              borderColor: copiedUuid === card.uuid ? '#1a8a50' : '#ccd',
                              background: copiedUuid === card.uuid ? '#e6f9ee' : '#fff',
                              color: copiedUuid === card.uuid ? '#1a8a50' : '#555',
                              cursor: 'pointer', fontWeight: '600',
                            }}>
                              {copiedUuid === card.uuid ? '✓' : 'コピー'}
                            </button>
                          </div>
                        </div>

                        {/* 編集フォーム */}
                        {editUuid === card.uuid && (
                          <div style={{ padding: '12px 14px', borderTop: '1px solid #edf0f8', background: '#fafbff' }}>
                            <input value={editLabel} onChange={e => setEditLabel(e.target.value)}
                              placeholder="ラベル" style={{ ...inp, marginBottom: '8px' }} autoFocus />
                            <input value={editUrl} onChange={e => setEditUrl(e.target.value)}
                              placeholder="リダイレクト先URL（https://...）" style={{ ...inp, marginBottom: '10px' }} />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleUpdate(card.uuid)} style={{ ...btnP, flex: 1 }} disabled={loading}>保存</button>
                              <button onClick={() => setEditUuid(null)} style={{ ...btnS, flex: 1 }}>キャンセル</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
