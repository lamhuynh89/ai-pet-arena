import axios from 'axios'

// Production default: https://api.huynhduclam.xyz
// LOCAL dev only: set VITE_API_BASE= (empty) in .env to use relative + Vite proxy
// Never hardcode relative '' as default (breaks prod deploys with separate API origin)
const rawBase = import.meta.env.VITE_API_BASE
const API_BASE = rawBase === '' ? '' : (rawBase || 'https://api.huynhduclam.xyz')

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
})

// AUTH

export async function register(username, password = null, wallet = null) {
  const { data } = await api.post('/auth/register', { username, password, wallet })
  return data
}

export async function login(username, password = null) {
  const { data } = await api.post('/auth/login', { username, password })
  return data
}

export async function claimPet(token, rootHash) {
  const { data } = await api.post('/auth/claim', { token, rootHash })
  return data
}

export async function getMyPets(token) {
  const { data } = await api.get('/auth/mypets', { params: { token } })
  return data
}

export async function getMe(token) {
  const { data } = await api.get('/auth/me', { params: { token } })
  return data
}

// PETS - updated to support token for auto-claim + owned flag
export async function createPet(name, personality, token = null) {
  const { data } = await api.post('/pets/create', { name, personality, token })
  return data
}

export async function loadPet(rootHash, token = null) {
  const config = token ? { params: { token } } : {}
  const { data } = await api.get(`/pets/load/${rootHash}`, config)
  return data
}

export async function sendChat(rootHash, message, token) {
  const { data } = await api.post('/chat', { rootHash, message, token })
  return data
}

export async function feed(rootHash, token) {
  const { data } = await api.post('/actions/feed', { rootHash, token })
  return data
}

export async function train(rootHash, token) {
  const { data } = await api.post('/actions/train', { rootHash, token })
  return data
}

export async function battle(rootHash, token) {
  const { data } = await api.post('/actions/battle', { rootHash, token })
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
  getPersonalities,
  register,
  login,
  claimPet,
  getMyPets,
  getMe
}
