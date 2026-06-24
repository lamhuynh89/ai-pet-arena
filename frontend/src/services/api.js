import axios from 'axios'

const API_BASE = 'https://api.huynhduclam.xyz'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
})

export async function createPet(name, personality) {
  const { data } = await api.post('/pets/create', { name, personality })
  return data
}

export async function loadPet(rootHash) {
  const { data } = await api.get(`/pets/load/${rootHash}`)
  return data
}

export async function sendChat(rootHash, message) {
  const { data } = await api.post('/chat', { rootHash, message })
  return data
}

export async function feed(rootHash) {
  const { data } = await api.post('/actions/feed', { rootHash })
  return data
}

export async function train(rootHash) {
  const { data } = await api.post('/actions/train', { rootHash })
  return data
}

export async function battle(rootHash) {
  const { data } = await api.post('/actions/battle', { rootHash })
  return data
}

export async function getPersonalities() {
  try {
    const { data } = await api.get('/pets/personalities')
    return data.personalities || []
  } catch {
    return [
      { key: 'playful', name: 'Playful', emoji: '🐶', traits: 'bouncy, excited' },
      { key: 'grumpy', name: 'Grumpy', emoji: '😾', traits: 'sarcastic' },
      { key: 'smart', name: 'Smart', emoji: '🦉', traits: 'logical' },
      { key: 'lazy', name: 'Lazy', emoji: '🦥', traits: 'sleepy' }
    ]
  }
}

export default {
  createPet,
  loadPet,
  sendChat,
  feed,
  train,
  battle,
  getPersonalities
}
