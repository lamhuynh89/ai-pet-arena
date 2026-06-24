// Pet model + helper (in-memory + 0G sync)

const { applyStatDecay } = require('./aiPet');
const { uploadPetData, downloadPetData } = require('./ogStorage');

// Simple uuid fallback (no extra dep)
function makeId() {
  return 'pet_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
}

let memoryStore = new Map(); // rootHash -> latestPet (for quick reloads)

function createPet(name, personality) {
  const validPers = ['playful', 'grumpy', 'smart', 'lazy'];
  if (!validPers.includes(personality)) personality = 'playful';

  const pet = {
    id: makeId(),
    name: name?.trim() || 'Unnamed',
    personality,
    stats: {
      hunger: 85,
      happiness: 75,
      energy: 90,
      xp: 10
    },
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    ogRootHash: null
  };
  return pet;
}

async function savePet(pet) {
  // Upload to 0G, update hash
  const result = await uploadPetData(pet);
  pet.ogRootHash = result.rootHash;
  pet.lastUpdated = new Date().toISOString();

  memoryStore.set(pet.ogRootHash, { ...pet }); // cache
  return { pet, storage: result };
}

async function loadPet(rootHash) {
  if (!rootHash) throw new Error('rootHash required');

  // Try cache first (works for both mock + recent real uploads)
  if (memoryStore.has(rootHash)) {
    const cached = { ...memoryStore.get(rootHash) };
    applyStatDecay(cached);
    return cached;
  }

  try {
    const data = await downloadPetData(rootHash);
    if (data && typeof data === 'object') {
      applyStatDecay(data);
      memoryStore.set(rootHash, data);
      return data;
    }
  } catch (e) {
    console.warn('[petModel] download failed, will try memory fallback:', e.message);
    // fallthrough to memory
  }

  if (memoryStore.has(rootHash)) {
    const c = memoryStore.get(rootHash);
    applyStatDecay(c);
    return c;
  }

  throw new Error('Pet not found or 0G fetch failed for ' + rootHash);
}

function getCached(rootHash) {
  return memoryStore.get(rootHash) || null;
}

module.exports = {
  createPet,
  savePet,
  loadPet,
  getCached,
  memoryStore
};
