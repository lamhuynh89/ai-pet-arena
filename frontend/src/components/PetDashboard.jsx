import React from 'react'
import ChatWindow from './ChatWindow'
import ActionPanel from './ActionPanel'
import BattleArena from './BattleArena'

// Simple SVG pet face for better visual (emoji + svg hybrid)
function PetFace({ personality }) {
  const size = 58
  const stroke = personality === 'playful' ? '#22c55e' : personality === 'grumpy' ? '#f59e0b' : personality === 'smart' ? '#3b82f6' : '#a78bfa'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{position:'absolute', opacity:0.85}}>
      <circle cx="32" cy="32" r="25" fill="none" stroke={stroke} strokeWidth="5"/>
      {personality === 'playful' && <>
        <circle cx="21" cy="25" r="3.5" fill={stroke}/>
        <circle cx="43" cy="25" r="3.5" fill={stroke}/>
        <path d="M22 41 Q32 48 42 41" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round"/>
      </>}
      {personality === 'grumpy' && <>
        <circle cx="21" cy="24" r="3" fill={stroke}/>
        <circle cx="43" cy="24" r="3" fill={stroke}/>
        <path d="M23 44 Q32 38 41 44" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round"/>
      </>}
      {personality === 'smart' && <>
        <circle cx="21" cy="26" r="3" fill={stroke}/>
        <circle cx="43" cy="26" r="3" fill={stroke}/>
        <path d="M22 40 L32 38 L42 40" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round"/>
      </>}
      {personality === 'lazy' && <>
        <circle cx="21" cy="27" r="3" fill={stroke}/>
        <circle cx="43" cy="27" r="3" fill={stroke}/>
        <path d="M23 42 Q32 45 41 42" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round"/>
      </>}
    </svg>
  )
}

export default function PetDashboard({ pet, rootHash, onUpdate, loading, setLoading, setError, token, isOwned }) {
  if (!pet) return null

  const { name, personality, stats = {} } = pet
  
  const persData = {
    playful: { emoji: '🐶', label: 'Playful', color: '#22c55e' },
    grumpy: { emoji: '😾', label: 'Grumpy', color: '#f59e0b' },
    smart: { emoji: '🦉', label: 'Smart', color: '#3b82f6' },
    lazy: { emoji: '🦥', label: 'Lazy', color: '#a78bfa' }
  }[personality] || { emoji: '🐾', label: personality, color: '#64748b' }

  const hunger = Math.max(0, Math.min(100, stats.hunger ?? 50))
  const happiness = Math.max(0, Math.min(100, stats.happiness ?? 50))
  const energy = Math.max(0, Math.min(100, stats.energy ?? 50))
  const xp = stats.xp ?? 0

  return (
    <div>
      {/* Pet Card Header */}
      <div className="card">
        <div className="pet-header">
          <div 
            className={`pet-avatar ${personality}`}
            style={{ borderColor: persData.color, position: 'relative' }}
          >
            <span style={{ fontSize: 58, lineHeight: 1 }}>{persData.emoji}</span>
            <PetFace personality={personality} />
          </div>
          
          <div className="pet-info">
            <h2>{name}</h2>
            <div className="meta">
              <span className="status-badge">{persData.label}</span>
              <span>LVL {Math.floor(xp / 50) + 1}</span>
              <span>XP <strong style={{ color: '#c084fc' }}>{xp}</strong></span>
            </div>
          </div>
        </div>

        {/* Stats with progress bars */}
        <div className="stats">
          <div className="stat">
            <div className="stat-label">🍖 HUNGER</div>
            <div className="stat-value">{hunger}</div>
            <div className="progress"><div className="progress-bar" style={{ width: `${hunger}%` }} /></div>
          </div>
          <div className="stat">
            <div className="stat-label">😊 HAPPINESS</div>
            <div className="stat-value">{happiness}</div>
            <div className="progress"><div className="progress-bar happiness" style={{ width: `${happiness}%` }} /></div>
          </div>
          <div className="stat">
            <div className="stat-label">⚡ ENERGY</div>
            <div className="stat-value">{energy}</div>
            <div className="progress"><div className="progress-bar energy" style={{ width: `${energy}%` }} /></div>
          </div>
          <div className="stat">
            <div className="stat-label">🌟 XP</div>
            <div className="stat-value">{xp}</div>
            <div className="progress"><div className="progress-bar xp" style={{ width: `${Math.min(100, (xp % 50) * 2)}%` }} /></div>
          </div>
        </div>
      </div>

      {/* Main Grid: Chat + Actions */}
      <div className="main-grid">
        <div>
          <ChatWindow 
            pet={pet} 
            rootHash={rootHash} 
            onUpdate={onUpdate} 
            setLoading={setLoading}
            setError={setError}
            token={token}
            isOwned={isOwned}
          />
        </div>
        
        <div>
          <ActionPanel 
            pet={pet} 
            rootHash={rootHash} 
            onUpdate={onUpdate} 
            loading={loading}
            setLoading={setLoading}
            setError={setError}
            token={token}
            isOwned={isOwned}
          />
          
          <BattleArena 
            pet={pet} 
            rootHash={rootHash} 
            onUpdate={onUpdate} 
            setLoading={setLoading}
            setError={setError}
            token={token}
            isOwned={isOwned}
          />
        </div>
      </div>
    </div>

      {!isOwned && token && (
        <div className="card" style={{ borderColor: '#f59e0b', background: '#1a2336' }}>
          <strong>🔒 Read-only view.</strong> Claim pet via box above to unlock Chat / Feed / Train / Battle.
        </div>
      )}
    </div>
  );
}
