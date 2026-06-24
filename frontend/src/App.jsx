import React, { useState, useEffect } from 'react'
import PetCreator from './components/PetCreator'
import PetDashboard from './components/PetDashboard'
import api from './services/api'

function App() {
  const [pet, setPet] = useState(null)
  const [rootHash, setRootHash] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [personalities, setPersonalities] = useState([])

  useEffect(() => {
    const savedHash = localStorage.getItem('lastPetRootHash')
    if (savedHash) {
      loadExistingPet(savedHash)
    }
    api.getPersonalities().then(setPersonalities).catch(() => {})
  }, [])

  async function loadExistingPet(hash) {
    setLoading(true)
    setError('')
    try {
      const data = await api.loadPet(hash)
      if (data.pet) {
        setPet(data.pet)
        setRootHash(hash)
        localStorage.setItem('lastPetRootHash', hash)
      }
    } catch (e) {
      setError('Failed to load pet: ' + e.message)
      localStorage.removeItem('lastPetRootHash')
    }
    setLoading(false)
  }

  async function handleCreate(name, personality) {
    setLoading(true)
    setError('')
    try {
      const res = await api.createPet(name, personality)
      if (res.success) {
        setPet(res.pet)
        setRootHash(res.rootHash)
        localStorage.setItem('lastPetRootHash', res.rootHash)
      } else {
        setError(res.error || 'Create failed')
      }
    } catch (e) {
      setError('Create error: ' + e.message)
    }
    setLoading(false)
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
    localStorage.removeItem('lastPetRootHash')
  }

  return (
    <div className="container">
      <div className="app-header">
        <div className="logo">
          🐾 <span>AI Pet Arena</span>
        </div>
        <div className="subtitle">Create • Chat • Train • Battle</div>
      </div>

      {error && (
        <div className="card error-card">
          {error} 
          <button onClick={() => setError('')} style={{ marginLeft: 12, background: '#7f1d1d', color: 'white' }}>Dismiss</button>
        </div>
      )}

      {!pet ? (
        <PetCreator onCreate={handleCreate} loading={loading} personalities={personalities} />
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="secondary" onClick={handleReload} disabled={loading}>
              🔄 Reload
            </button>
            <button className="secondary" onClick={handleNewPet}>
              ➕ New Pet
            </button>
            <div className="root-hash" style={{ marginLeft: 'auto', fontSize: '11px' }}>
              {rootHash?.slice(0, 14)}…
            </div>
          </div>

          <PetDashboard 
            pet={pet} 
            rootHash={rootHash} 
            onUpdate={updatePet} 
            loading={loading}
            setLoading={setLoading}
            setError={setError}
          />
        </>
      )}

      <div className="footer">
        MVP • 0G testnet (or mock) • React + Vite • Node ≥18 • Windows Server 2016 ready
      </div>
    </div>
  )
}

export default App
