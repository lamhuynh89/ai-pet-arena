import React from 'react'
import api from '../services/api'

export default function MyPets({ token, myPets, onSelectPet, onRefresh, loading }) {
  const [refreshing, setRefreshing] = React.useState(false)

  async function handleRefresh() {
    if (!token) return
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }

  if (!token) {
    return (
      <div className="card">
        <h3>📦 My Pets</h3>
        <div style={{ color: '#64748b' }}>Login to see your claimed pets.</div>
      </div>
    )
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>📦 My Pets ({myPets.length})</h3>
        <button onClick={handleRefresh} disabled={refreshing || loading} className="secondary" style={{ padding: '4px 10px', fontSize: 12 }}>
          {refreshing ? '...' : '↻'}
        </button>
      </div>

      {myPets.length === 0 ? (
        <div style={{ color: '#64748b', fontSize: 13 }}>
          No pets claimed yet. Create pet while logged (auto-claims) or Claim by rootHash above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {myPets.map((hash, idx) => (
            <div 
              key={idx}
              onClick={() => onSelectPet(hash)}
              style={{
                padding: '8px 12px',
                background: '#0f1525',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: 12,
                border: '1px solid #2a334a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{hash.slice(0, 18)}…</span>
              <span style={{ fontSize: 11, color: '#22c55e' }}>Load →</span>
            </div>
          ))}
        </div>
      )}

      <div className="helper-text" style={{ marginTop: 8 }}>
        Only claimed pets can be used for Chat / Feed / Train / Battle.
      </div>
    </div>
  )
}
