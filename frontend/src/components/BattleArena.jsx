import React, { useState } from 'react'
import api from '../services/api'

export default function BattleArena({ pet, rootHash, onUpdate, setLoading, setError, token, isOwned = false }) {
  const [lastBattle, setLastBattle] = useState(null)

  async function startBattle() {
    if (!rootHash || !token || !isOwned) {
      setError('Login + claim pet required to battle')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await api.battle(rootHash, token)
      if (res.success) {
        setLastBattle(res)
        onUpdate(res.pet, res.rootHash)
      }
    } catch (e) {
      const msg = e.response?.data?.error || e.message
      setError('Battle failed: ' + msg)
    }
    setLoading(false)
  }

  return (
    <div className="card">
      <h3>⚔️ Battle Arena</h3>
      
      <button 
        onClick={startBattle} 
        disabled={!rootHash || !token || !isOwned}
        className="battle"
        style={{ width: '100%', justifyContent: 'center' }}
      >
        🐺 FIGHT vs Shadow Fang
      </button>

      {lastBattle && (
        <div style={{ marginTop: 14 }}>
          <div className={`battle-result ${lastBattle.result === 'WIN' ? 'win' : 'lose'}`}>
            {lastBattle.result === 'WIN' ? '🏆 VICTORY!' : '💀 DEFEATED'} vs {lastBattle.opponent?.name}
          </div>
          <div style={{ fontSize: 13, marginTop: 8, color: '#94a3b8' }}>
            {lastBattle.message}<br />
            XP: <strong style={{ color: lastBattle.powerDelta > 0 ? '#86efac' : '#fca5a5' }}>
              {lastBattle.powerDelta > 0 ? '+' : ''}{lastBattle.powerDelta}
            </strong>
          </div>
        </div>
      )}

      <div className="helper-text">
        Outcome based on XP + Energy + Happiness + luck.
      </div>
    </div>
  )
}
