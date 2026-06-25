import React from 'react'
import api from '../services/api'

export default function ActionPanel({ pet, rootHash, onUpdate, loading, setLoading, setError, token, isOwned = false }) {
  async function doAction(action) {
    if (!rootHash || !token || !isOwned) {
      setError('Login + claim pet required for actions')
      return
    }
    setLoading(true)
    setError('')

    try {
      let res
      if (action === 'feed') res = await api.feed(rootHash, token)
      if (action === 'train') res = await api.train(rootHash, token)
      
      if (res?.success) {
        onUpdate(res.pet, res.rootHash)
      }
    } catch (e) {
      const msg = e.response?.data?.error || e.message
      setError(action + ' failed: ' + msg)
    }
    setLoading(false)
  }

  return (
    <div className="card">
      <h3>⚙️ Care Actions</h3>
      
      <div className="actions-grid">
        <button 
          onClick={() => doAction('feed')} 
          disabled={loading || !rootHash || !token || !isOwned}
        >
          🍖 Feed Pet
          <span style={{ fontSize: 11.5, opacity: 0.75 }}>+Hunger +Happiness</span>
        </button>
        
        <button 
          onClick={() => doAction('train')} 
          disabled={loading || !rootHash || !token || !isOwned}
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
