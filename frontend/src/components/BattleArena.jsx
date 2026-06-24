import React, { useState } from 'react'
import api from '../services/api'

export default function BattleArena({ pet, rootHash, onUpdate, setLoading, setError }) {
  const [lastBattle, setLastBattle] = useState(null)

  async function startBattle() {
    if (!rootHash) return
    setLoading(true)
    setError('')

    try {
      const res = await api.battle(rootHash)
      if (res.success) {
        setLastBattle(res)
        onUpdate(res.pet, res.rootHash)
      }
    } catch (e) {
      setError('Battle failed: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div className="card">
      <h3>⚔️ Battle Arena</h3>
      
      <button 
        onClick={startBattle} 
        disabled={!rootHash}
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
