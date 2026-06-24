import React from 'react'
import api from '../services/api'

export default function ActionPanel({ pet, rootHash, onUpdate, loading, setLoading, setError }) {
  async function doAction(action) {
    if (!rootHash) return
    setLoading(true)
    setError('')

    try {
      let res
      if (action === 'feed') res = await api.feed(rootHash)
      if (action === 'train') res = await api.train(rootHash)
      
      if (res?.success) {
        onUpdate(res.pet, res.rootHash)
      }
    } catch (e) {
      setError(action + ' failed: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div className="card">
      <h3>⚙️ Care Actions</h3>
      
      <div className="actions-grid">
        <button 
          onClick={() => doAction('feed')} 
          disabled={loading || !rootHash}
        >
          🍖 Feed Pet
          <span style={{ fontSize: 11.5, opacity: 0.75 }}>+Hunger +Happiness</span>
        </button>
        
        <button 
          onClick={() => doAction('train')} 
          disabled={loading || !rootHash}
          className="secondary"
        >
          🏋️ Train
          <span style={{ fontSize: 11.5, opacity: 0.75 }}>+XP −Energy</span>
        </button>
      </div>

      <div className="helper-text">
        💡 Stats slowly decay. Keep pet fed &amp; happy.
      </div>
    </div>
  )
}
