'use client'

import { useState, useEffect } from 'react'

const K = {
  navy: '#0f1f3d',
  blue: '#1e5a9f',
}

interface UserCardEditProps {
  uuid: string
  onClose: () => void
}

export default function UserCardEdit({ uuid, onClose }: UserCardEditProps) {
  const [currentUrl, setCurrentUrl] = useState('')
  const [inputUrl, setInputUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch(`/api/redirect?uuid=${encodeURIComponent(uuid)}`)
      .then(r => r.json())
      .then(d => { setCurrentUrl(d.url || ''); setInputUrl(d.url || '') })
      .catch(() => {})
  }, [uuid])

  const handleSave = async () => {
    if (!inputUrl) return
    setLoading(true)
    try {
      const r = await fetch('/api/redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', uuid, url: inputUrl }),
      })
      const d = await r.json()
      if (d.error) setMsg('× ' + d.error)
      else {
        setCurrentUrl(inputUrl)
        setMsg('✓ 保存しました')
        setTimeout(() => setMsg(''), 3000)
      }
    } catch { setMsg('× 通信エラー') }
    setLoading(false)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,10,30,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#fff', borderRadius: '18px', padding: '28px',
        width: '100%', maxWidth: '380px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: K.navy, margin: 0 }}>リンク先URLの変更</h2>
            <p style={{ fontSize: '11px', color: '#999', marginTop: '3px' }}>NFCカードのリダイレクト先を更新</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#bbb', lineHeight: 1, padding: '4px' }}>×</button>
        </div>

        {/* 現在のURL */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', fontWeight: '600', color: '#6680aa', marginBottom: '5px' }}>現在のリンク先</p>
          <p style={{
            fontSize: '12px', color: '#555', background: '#f4f6fb',
            padding: '8px 10px', borderRadius: '8px', wordBreak: 'break-all', margin: 0,
          }}>
            {currentUrl || '読み込み中...'}
          </p>
        </div>

        {/* メッセージ */}
        {msg && (
          <div style={{
            padding: '9px 12px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px',
            background: msg.startsWith('✓') ? '#e6f9ee' : '#fff0f0',
            color: msg.startsWith('✓') ? '#1a8a50' : '#cc2222',
          }}>{msg}</div>
        )}

        {/* 新しいURL */}
        <input
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="新しいURL（https://...）"
          style={{
            width: '100%', padding: '11px 13px', borderRadius: '9px',
            border: '1.5px solid #d0d8e8', fontSize: '14px',
            boxSizing: 'border-box', outline: 'none', marginBottom: '12px',
          }}
        />
        <button
          onClick={handleSave}
          disabled={loading || !inputUrl || inputUrl === currentUrl}
          style={{
            width: '100%', padding: '11px', borderRadius: '9px', border: 'none',
            background: K.blue, color: '#fff', fontSize: '14px', fontWeight: '700',
            cursor: loading || !inputUrl || inputUrl === currentUrl ? 'not-allowed' : 'pointer',
            opacity: loading || !inputUrl || inputUrl === currentUrl ? 0.6 : 1,
          }}
        >
          {loading ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  )
}
