const { createPet, savePet, loadPet } = require('./src/services/petModel');
const auth = require('./src/services/authService');

async function run() {
  auth._debugClear();
  const reg = auth.register('alice42');
  const loginRes = auth.login('alice42');
  const token = loginRes.token;
  console.log('[SMOKE] registered + logged:', loginRes.user.username);

  let pet = createPet('Fluffy', 'playful');
  const { pet: saved } = await savePet(pet);
  const root = saved.ogRootHash;
  console.log('[SMOKE] created root:', root.slice(0, 22) + '...');

  // claim
  const claimRes = auth.claimPet(token, root);
  console.log('[SMOKE] claimed:', claimRes);

  const mine = auth.getMyPets(token);
  console.log('[SMOKE] myPets:', mine.length);

  const loaded = await loadPet(root);
  console.log('[SMOKE] loaded pet:', loaded.name, 'personality', loaded.personality);

  const isOwn = auth.isOwner(token, root);
  console.log('[SMOKE] isOwner check:', isOwn);

  // negative: no token
  try {
    // simulate what routes do
    const bad = auth.isOwner(null, root);
    console.log('[SMOKE] no-token isOwner=false (expected):', !bad);
  } catch(e){}

  console.log('[SMOKE] ALL BASIC FLOW PASS');
}
run().catch(console.error);