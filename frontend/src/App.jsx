import React, { useState, useEffect } from 'react'
import PetCreator from './components/PetCreator'
import PetDashboard from './components/PetDashboard'
import AuthPanel from './components/AuthPanel'
import MyPets from './components/MyPets'
import api from './services/api'

function App() {
  const [pet, setPet] = useState(null)
  const [rootHash, setRootHash] = useState(null)
  const [owned, setOwned] = useState(false) // true if current pet claimed by logged user
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [personalities, setPersonalities] = useState([])

  // Auth state
  const [authToken, setAuthToken] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [myPets, setMyPets] = useState([])

  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    // Restore auth
    const savedToken = localStorage.getItem('authToken')
    const savedUser = localStorage.getItem('authUser')
    if (savedToken) {
      setAuthToken(savedToken)
      if (savedUser) {
        try { setAuthUser(JSON.parse(savedUser)) } catch {}
      }
      // fetch latest my pets
      refreshMyPets(savedToken)
    }

    // Restore last active pet
    const savedHash = localStorage.getItem('lastPetRootHash')
    if (savedHash) {
      loadExistingPet(savedHash, savedToken)
    }
    api.getPersonalities().then(setPersonalities).catch(() => {})
  }, [])

  async function refreshMyPets(token = authToken) {
    if (!token) return
    try {
      const res = await api.getMyPets(token)
      if (res.success) setMyPets(res.pets || [])
    } catch (e) {
      // token stale? clear
      if (e.message?.includes('token')) {
        handleLogout()
      }
    }
  }

  async function loadExistingPet(hash, tokenOverride = null) {
    const t = tokenOverride !== null ? tokenOverride : authToken
    setLoading(true)
    setError('')
    try {
      const data = await api.loadPet(hash, t)
      if (data.pet) {
        setPet(data.pet)
        setRootHash(hash)
        setOwned(!!data.owned)
        localStorage.setItem('lastPetRootHash', hash)
      }
    } catch (e) {
      setError('Failed to load pet: ' + (e.response?.data?.error || e.message))
      localStorage.removeItem('lastPetRootHash')
    }
    setLoading(false)
  }

  async function handleCreate(name, personality) {
    setLoading(true)
    setError('')
    try {
      const res = await api.createPet(name, personality, authToken)
      if (res.success) {
        setPet(res.pet)
        setRootHash(res.rootHash)
        setOwned(!!res.claimed || !!authToken) // if token was passed, backend tried auto-claim
        localStorage.setItem('lastPetRootHash', res.rootHash)

        // refresh my pets if logged
        if (authToken) {
          setTimeout(() => refreshMyPets(), 300)
        }
      } else {
        setError(res.error || 'Create failed')
      }
    } catch (e) {
      setError('Create error: ' + e.message)
    }
    setLoading(false)
  }

  async function handleClaim(rootHashToClaim) {
    if (!authToken || !rootHashToClaim) {
      setError('Login first then claim')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.claimPet(authToken, rootHashToClaim)
      if (res.success) {
        setError('')
        await refreshMyPets()
        if (rootHash === rootHashToClaim) {
          setOwned(true)
        }
        await loadExistingPet(rootHashToClaim)
      } else {
        setError(res.error || 'Claim failed')
      }
    } catch (e) {
      setError('Claim error: ' + (e.response?.data?.error || e.message))
    }
    setLoading(false)
  }

  // Manual claim by pasting rootHash
  async function handleManualClaim(hash) {
    if (!hash || !authToken) return
    const clean = hash.trim()
    if (!clean.startsWith('0x')) {
      setError('rootHash must start with 0x')
      return
    }
    await handleClaim(clean)
  }

  function updatePet(newPet, newHash) {
    setPet(newPet)
    if (newHash) {
      setRootHash(newHash)
      localStorage.setItem('lastPetRootHash', newHash)
    }
  }

  async function handleReload() {
    if (rootHash) await loadExistingPet(rootHash)
  }

  function handleNewPet() {
    setPet(null)
    setRootHash(null)
    setOwned(false)
    localStorage.removeItem('lastPetRootHash')
  }

  function handleAuthSuccess(token, user) {
    setAuthToken(token)
    setAuthUser(user || { username: 'user' })
    setShowAuth(false)
    refreshMyPets(token)
    // if a pet is loaded and not yet owned, auto-claim
    if (rootHash && !owned) {
      api.claimPet(token, rootHash).then((r) => {
        if (r && r.success) { setOwned(true); refreshMyPets(token) }
      }).catch(() => {})
    }
  }

  function handleSkipAuth() {
    setShowAuth(false)
  }

  function handleLogout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    setAuthToken(null)
    setAuthUser(null)
    setMyPets([])
    setOwned(false)
    // keep current pet visible but mark not-owned
  }

  // Pass token + ownership info down to child components
  const effectiveToken = authToken

  return (
    <div className="container">
      <div className="app-header">
        <div className="logo">
          🐾 <span>AI Pet Arena</span>
        </div>
        <div className="subtitle">Create • Chat • Train • Battle • Own</div>
      </div>

      {/* Auth bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {authToken ? (
          <>
            <div style={{ background: '#162033', padding: '4px 12px', borderRadius: 999, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              👤 <strong>{authUser?.username || 'user'}</strong>
              {authUser?.wallet && <span style={{ opacity: 0.6, fontSize: 11 }}>• {authUser.wallet.slice(0,6)}…</span>}
            </div>
            <button onClick={handleLogout} className="secondary" style={{ padding: '4px 10px', fontSize: 12 }}>Logout</button>
          </>
        ) : (
          <button onClick={() => setShowAuth(!showAuth)} className="secondary">
            {showAuth ? 'Hide Login' : '🔐 Login / Register (for ownership)'}
          </button>
        )}
      </div>

      {error && (
        <div className="card error-card">
          {error} 
          <button onClick={() => setError('')} style={{ marginLeft: 12, background: '#7f1d1d', color: 'white' }}>Dismiss</button>
        </div>
      )}

      {showAuth && !authToken && (
        <AuthPanel onAuthSuccess={handleAuthSuccess} onSkip={handleSkipAuth} />
      )}

      {/* My Pets panel (only visible when logged in) */}
      {authToken && (
        <MyPets 
          token={authToken} 
          myPets={myPets} 
          onSelectPet={(hash) => loadExistingPet(hash)} 
          onRefresh={() => refreshMyPets()}
          loading={loading}
        />
      )}

      {/* Quick load any rootHash (guest or logged) */}
      <div className="card" style={{ background: '#111827' }}>
        <div style={{ fontSize: 13, marginBottom: 6, fontWeight: 600 }}>📥 Load Pet by rootHash (guest view OK)</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            id="load-hash"
            placeholder="0x... load any pet rootHash"
            style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const v = e.target.value.trim(); if (v) loadExistingPet(v)
              }
            }}
          />
          <button className="secondary" onClick={() => {
            const inp = document.getElementById('load-hash')
            if (inp && inp.value.trim()) loadExistingPet(inp.value.trim())
          }}>Load</button>
        </div>
      </div>

      {/* Global Claim by rootHash (always visible when logged) */}
      {authToken && (
        <div className="card" style={{ background: '#1a2336', border: '1px solid #f59e0b' }}>
          <div style={{ fontSize: 13, marginBottom: 8, fontWeight: 600 }}>⚖️ Claim Pet by rootHash</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="claim-input"
              placeholder="0x1234... paste rootHash"
              style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.target.value.trim()
                  if (val) handleManualClaim(val)
                }
              }}
            />
            <button
              onClick={() => {
                const inp = document.getElementById('claim-input')
                if (inp && inp.value.trim()) handleManualClaim(inp.value)
              }}
              disabled={loading}
              style={{ background: '#f59e0b', whiteSpace: 'nowrap' }}
            >
              Claim
            </button>
          </div>
          <div className="helper-text" style={{ marginTop: 6 }}>Paste any 0G rootHash to own it and unlock full Chat/Actions.</div>
        </div>
      )}

      {/* Current pet claim nudge */}
      {authToken && rootHash && !owned && (
        <div style={{ fontSize: 12, color: '#f59e0b', marginTop: -8, marginBottom: 8 }}>
          Current pet not owned → use claim box above or button below
        </div>
      )}
      {authToken && rootHash && !owned && (
        <button onClick={() => handleClaim(rootHash)} disabled={loading} style={{ background: '#f59e0b', marginBottom: 12 }}>
          Claim Current ({rootHash.slice(0,14)}…)
        </button>
      )}

      {!pet ? (
        <PetCreator onCreate={handleCreate} loading={loading} personalities={personalities} isLoggedIn={!!authToken} />
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="secondary" onClick={handleReload} disabled={loading}>
              🔄 Reload
            </button>
            <button className="secondary" onClick={handleNewPet}>
              ➕ New Pet
            </button>

            {authToken && rootHash && !owned && (
              <button onClick={() => handleClaim(rootHash)} disabled={loading} style={{ background: '#f59e0b' }}>
                Claim this pet
              </button>
            )}

            <div className="root-hash" style={{ marginLeft: 'auto', fontSize: '11px' }}>
              {rootHash?.slice(0, 14)}…
              {owned && <span style={{ marginLeft: 6, color: '#22c55e' }}>✓ owned</span>}
              {!owned && authToken && <span style={{ marginLeft: 6, color: '#f59e0b' }}>guest view</span>}
            </div>
          </div>

          <PetDashboard 
            pet={pet} 
            rootHash={rootHash} 
            onUpdate={updatePet} 
            loading={loading}
            setLoading={setLoading}
            setError={setError}
            token={effectiveToken}
            isOwned={owned}
          />
        </>
      )}

      <div className="footer">
        Web3 Ownership MVP • Register → Create/Claim → My Pets • Restricted actions on owned pets only • 0G storage
      </div>
    </div>
  )
}

export default App
