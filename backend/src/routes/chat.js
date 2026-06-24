const express = require('express');
const router = express.Router();
const { generatePetResponse, applyStatDecay } = require('../services/aiPet');
const { loadPet, savePet } = require('../services/petModel');

router.post('/', async (req, res) => {
  try {
    const { rootHash, message } = req.body;
    if (!rootHash || !message) {
      return res.status(400).json({ error: 'rootHash and message required' });
    }

    let pet = await loadPet(rootHash);
    applyStatDecay(pet);

    // Hybrid: 0G Compute (if AI_MODE=0g) or template
    const aiResult = await generatePetResponse(pet, message);
    const reply = aiResult.reply;

    // Small happiness bump from talking
    pet.stats.happiness = Math.min(100, pet.stats.happiness + 2);
    pet.lastUpdated = new Date().toISOString();

    // Re-upload to 0G
    const { pet: saved } = await savePet(pet);

    res.json({
      success: true,
      pet: saved,
      reply,
      usedRealAI: aiResult.usedReal || false,
      rootHash: saved.ogRootHash
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
