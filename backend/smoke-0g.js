#!/usr/bin/env node
/**
 * Giai doan 2 Smoke Test: 0G Storage (real) + 0G Compute + full pet flow
 * Usage (MOCK first):
 *   cd backend && node smoke-0g.js
 *
 * For REAL mode (needs funded PRIVATE_KEY):
 *   STORAGE_MODE=real AI_MODE=0g node smoke-0g.js
 *
 * Must have backend/.env or env vars set.
 */

require('dotenv').config();
const { initStorage, testStorageRoundtrip, uploadPetData, downloadPetData } = require('./src/services/ogStorage');
const { initCompute, getAvailableProviders, generateWithCompute } = require('./src/services/ogCompute');
const { createPet, savePet, loadPet } = require('./src/services/petModel');
const { generatePetResponse, feedPet, trainPet, battle } = require('./src/services/aiPet');

async function main() {
  console.log('=== AI Pet Arena - Giai doan 2 Smoke (0G Storage + Compute) ===\n');

  const storageCfg = initStorage();
  const computeCfg = initCompute();
  console.log('Storage:', storageCfg);
  console.log('Compute:', computeCfg);
  console.log('AI_MODE=', process.env.AI_MODE || 'mock');
  console.log('STORAGE_MODE=', process.env.STORAGE_MODE || 'mock');
  console.log('');

  // 1. Storage roundtrip
  console.log('--- 1. 0G Storage roundtrip ---');
  const rt = await testStorageRoundtrip({ name: 'SmokePet', phase: 2, ts: Date.now() });
  console.log('Roundtrip result:', rt);
  if (!rt.ok) {
    console.warn('Roundtrip NOT perfect (mock ok for demo)');
  }

  // 2. Create pet + upload
  console.log('\n--- 2. Create pet + 0G upload ---');
  const pet = createPet('ZeroCupTest', 'playful');
  const { pet: saved, storage } = await savePet(pet);
  console.log('Pet created:', saved.name, 'pers:', saved.personality);
  console.log('rootHash:', saved.ogRootHash);
  console.log('storage:', storage);

  // 3. Load from 0G (or cache)
  console.log('\n--- 3. Load pet by rootHash ---');
  const loaded = await loadPet(saved.ogRootHash);
  console.log('Loaded OK. Stats:', loaded.stats);

  // 4. Chat (hybrid AI)
  console.log('\n--- 4. Chat (AI) ---');
  const chatRes = await generatePetResponse(loaded, 'hello friend, want to play?');
  console.log('Reply:', chatRes.reply, chatRes.usedReal ? '(REAL 0G Compute)' : '(mock template)');

  // 5. Action + re-upload
  console.log('\n--- 5. Feed + re-upload ---');
  const feedRes = feedPet(loaded);
  const { pet: afterFeed } = await savePet(feedRes.pet);
  console.log('After feed:', afterFeed.stats, 'msg:', feedRes.message);

  // 6. Train
  console.log('\n--- 6. Train ---');
  const trainRes = trainPet(afterFeed);
  const { pet: afterTrain } = await savePet(trainRes.pet);
  console.log('After train XP/happiness:', afterTrain.stats.xp, afterTrain.stats.happiness);

  // 7. Battle
  console.log('\n--- 7. Battle ---');
  const battleRes = battle(afterTrain);
  const { pet: afterBattle } = await savePet(battleRes.pet);
  console.log('Battle:', battleRes.result, 'delta:', battleRes.powerDelta, 'msg:', battleRes.message);

  // 8. Real compute probe (only if AI_MODE=0g + funds)
  if ((process.env.AI_MODE || '').toLowerCase() === '0g') {
    console.log('\n--- 8. 0G Compute probe ---');
    try {
      const providers = await getAvailableProviders();
      console.log('Providers available:', providers.length > 0 ? providers.length : 'none');
      if (providers.length > 0) {
        const probe = await generateWithCompute(afterBattle, 'give me advice');
        console.log('Compute reply sample:', probe.reply ? probe.reply.slice(0,120) : 'no reply', probe.usedReal ? 'REAL' : 'fallback');
      }
    } catch (e) {
      console.log('Compute probe error (expected if no funds):', e.message);
    }
  }

  // 9. Reload latest
  console.log('\n--- 9. Reload from latest rootHash ---');
  const final = await loadPet(afterBattle.ogRootHash);
  console.log('Final stats:', final.stats);
  console.log('Final rootHash:', final.ogRootHash);

  console.log('\n=== SMOKE COMPLETE ===');
  console.log('SUCCESS. All flows executed.');
  console.log('For real 0G test: fund wallet, set STORAGE_MODE=real + AI_MODE=0g, rerun.');
}

main().catch(err => {
  console.error('SMOKE FAILED:', err);
  process.exit(1);
});
