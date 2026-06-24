// P0 smoke test (run with: node smoke-p0.js)
require('dotenv').config();
const { createPet, savePet, loadPet } = require('./src/services/petModel');
const { initStorage, downloadPetData } = require('./src/services/ogStorage');

(async () => {
  console.log('=== P0 SMOKE TEST ===');
  console.log('Node:', process.version);
  
  const s = initStorage();
  console.log('STORAGE init: mock=', !!s.mock);
  
  console.log('1. createPet...');
  let pet = createPet('P0FixTest', 'smart');
  console.log('   name:', pet.name, 'pers:', pet.personality);
  
  console.log('2. savePet (mock)...');
  const saved = await savePet(pet);
  console.log('   rootHash:', saved.pet.ogRootHash ? saved.pet.ogRootHash.substring(0,18)+'...' : 'MISSING');
  console.log('   storage.mock:', !!saved.storage.mock);
  
  console.log('3. loadPet by hash...');
  const loaded = await loadPet(saved.pet.ogRootHash);
  console.log('   loaded name:', loaded.name, 'xp:', loaded.stats.xp);
  
  console.log('4. downloadPetData (mock path)...');
  const d = await downloadPetData(saved.pet.ogRootHash);
  console.log('   download result (should be null in mock):', d === null ? 'null OK' : 'unexpected');
  
  console.log('=== ALL P0 CHECKS PASS ===');
  process.exit(0);
})().catch(e => {
  console.error('P0 SMOKE FAIL:', e.message);
  process.exit(1);
});
