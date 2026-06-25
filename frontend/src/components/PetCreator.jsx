import React, { useState } from 'react'

const DEFAULT_PERSONALITIES = [
  { key: 'playful', name: 'Playful', emoji: '🐶', traits: 'Bouncy & excited', color: '#22c55e' },
  { key: 'grumpy', name: 'Grumpy', emoji: '😾', traits: 'Sarcastic & short', color: '#f59e0b' },
  { key: 'smart', name: 'Smart', emoji: '🦉', traits: 'Logical & precise', color: '#3b82f6' },
  { key: 'lazy', name: 'Lazy', emoji: '🦥', traits: 'Sleepy & slow', color: '#a78bfa' }
]

export default function PetCreator({ onCreate, loading, personalities, isLoggedIn }) {
  const [name, setName] = useState('')
  const [personality, setPersonality] = useState('playful')

  const persList = personalities.length > 0 
    ? personalities.map(p => ({ 
        key: p.key, 
        name: p.name, 
        emoji: p.emoji, 
        traits: p.traits,
        color: p.key === 'playful' ? '#22c55e' : p.key === 'grumpy' ? '#f59e0b' : p.key === 'smart' ? '#3b82f6' : '#a78bfa'
      })) 
    : DEFAULT_PERSONALITIES

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreate(name.trim(), personality)
  }

  return (
    <div className="card">
      <h2>🦎 Create Your AI Pet</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>PET NAME</label>
          <input
            type="text"
            placeholder="e.g. Pixel, Shadow, Luna"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            style={{ width: '100%', maxWidth: 300 }}
            maxLength={20}
          />
        </div>

        <div style={{ margin: '12px 0 6px' }}>
          <label style={{ display: 'block', marginBottom: 8, color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>CHOOSE PERSONALITY</label>
          
          <div className="pers-grid">
            {persList.map(p => (
              <div
                key={p.key}
                className={`pers-card ${personality === p.key ? 'active' : ''}`}
                onClick={() => !loading && setPersonality(p.key)}
              >
                <span className="emoji">{p.emoji}</span>
                <div className="name">{p.name}</div>
                <div className="traits">{p.traits}</div>
              </div>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || !name.trim()}
          style={{ marginTop: 10, width: '100%', maxWidth: 300 }}
        >
          {loading ? '⏳ Creating & Uploading to 0G...' : '✨ Create Pet & Save to 0G'}
        </button>
      </form>

      <div style={{ marginTop: 14, padding: 11, background: '#0f1525', borderRadius: 10, fontSize: 11.5, color: '#64748b' }}>
        📦 Saved to decentralized 0G Storage. Keep the root hash to reload later.
        {isLoggedIn && <div style={{marginTop:4, color:'#22c55e'}}>✓ Will auto-claim to your account</div>}
      </div>
    </div>
  )
}
