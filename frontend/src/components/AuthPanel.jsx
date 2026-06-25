import React, { useState } from 'react'
import api from '../services/api'

export default function AuthPanel({ onAuthSuccess, onSkip }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [wallet, setWallet] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username.trim()) {
      setErr('username required')
      return
    }
    if (mode === 'register' && !wallet.trim()) {
      setErr('wallet address is required for Web3 ownership')
      return
    }
    setLoading(true)
    setErr('')
    try {
      let res
      if (mode === 'register') {
        res = await api.register(username.trim(), password || null, wallet || null)
        if (res.error) throw new Error(res.error)
        // auto-login after register for UX
        res = await api.login(username.trim(), password || null)
      } else {
        res = await api.login(username.trim(), password || null)
      }
      if (res.error) throw new Error(res.error)
      if (!res.token) throw new Error('no token from server')

      // persist
      localStorage.setItem('authToken', res.token)
      localStorage.setItem('authUser', JSON.stringify(res.user || { username: username.trim() }))

      onAuthSuccess(res.token, res.user)
    } catch (e) {
      setErr(e.message || 'auth failed')
    }
    setLoading(false)
  }

  function handleSkip() {
    onSkip && onSkip()
  }

  return (
    <div className="card">
      <h2>🔐 {mode === 'login' ? 'Login' : 'Register'} for Pet Ownership</h2>
      <div style={{ marginBottom: 12, fontSize: 13, color: '#64748b' }}>
        Web3 Pet Arena ownership: Register/Login → Claim pets → Full access to Chat/Feed/Train/Battle
      </div>

      {err && <div style={{ color: '#f87171', marginBottom: 10, fontSize: 13 }}>{err}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12, color: '#94a3b8' }}>USERNAME (required)</label>
          <input 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            placeholder="e.g. petmaster42" 
            disabled={loading}
            style={{ width: '100%', marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12, color: '#94a3b8' }}>PASSWORD (optional for demo)</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="leave empty for username-only login" 
            disabled={loading}
            style={{ width: '100%', marginTop: 4 }}
          />
        </div>

        {mode === 'register' && (
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12, color: '#94a3b8' }}>WALLET (required for Web3 ownership)</label>
            <input 
              value={wallet} 
              onChange={e => setWallet(e.target.value)} 
              placeholder="0x..." 
              disabled={loading}
              style={{ width: '100%', marginTop: 4 }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="submit" disabled={loading || !username.trim() || (mode === 'register' && !wallet.trim())} style={{ flex: 1 }}>
            {loading ? '...' : (mode === 'login' ? 'Login' : 'Register & Login')}
          </button>
          <button 
            type="button" 
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')} 
            className="secondary"
            disabled={loading}
          >
            {mode === 'login' ? '→ Register' : '→ Login'}
          </button>
        </div>
      </form>

      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #2a334a' }}>
        <button onClick={handleSkip} className="secondary" style={{ width: '100%' }}>
          Skip for now (Guest mode) — Limited actions
        </button>
        <div className="helper-text" style={{ marginTop: 6 }}>
          Guest: create + view pets. Login to claim + unlock full interactions.
        </div>
      </div>
    </div>
  )
}
