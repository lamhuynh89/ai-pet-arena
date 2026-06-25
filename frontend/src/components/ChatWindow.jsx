import React, { useState } from 'react'
import api from '../services/api'

export default function ChatWindow({ pet, rootHash, onUpdate, setLoading, setError, token, isOwned = false }) {
  const [input, setInput] = useState('')
  const [log, setLog] = useState([
    { type: 'ai', text: `Hello! I'm ${pet.name}. (${pet.personality})` }
  ])

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || !rootHash) return

    const userMsg = input.trim()
    setLog(l => [...l, { type: 'user', text: userMsg }])
    setInput('')
    setLoading(true)
    setError('')

    try {
      const res = await api.sendChat(rootHash, userMsg, token)
      if (res.success) {
        setLog(l => [...l, { type: 'ai', text: res.reply }])
        onUpdate(res.pet, res.rootHash)
      }
    } catch (e) {
      setError('Chat failed: ' + (e.response?.data?.error || e.message))
    }
    setLoading(false)
  }

  return (
    <div className="card">
      <h3>💬 Chat with {pet.name}</h3>
      
      <div className="chat-log">
        {log.map((entry, i) => (
          <div key={i} className={`log-entry ${entry.type}`}>
            <strong>{entry.type === 'user' ? 'You' : pet.name}:</strong> {entry.text}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Talk to ${pet.name}...`}
          style={{ flex: 1 }}
          disabled={!rootHash || !token || !isOwned}
        />
        {token && !isOwned && <span style={{fontSize:11, color:'#f59e0b', alignSelf:'center'}}>claim needed</span>}
        <button type="submit" disabled={!input.trim() || !token || !isOwned}>Send</button>
      </form>
      
      <div className="helper-text">
        AI replies adapt to {pet.personality} personality.
        {!isOwned && <span style={{color:'#f59e0b'}}> — Claim to unlock chat</span>}
      </div>
    </div>
  )
}
