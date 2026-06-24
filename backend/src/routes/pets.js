const express = require('express');
const router = express.Router();
const { createPet, savePet, loadPet } = require('../services/petModel');

router.post('/create', async (req, res) => {
  try {
    const { name, personality } = req.body;
    if (!name || !personality) {
      return res.status(400).json({ error: 'name and personality required' });
    }
    const pet = createPet(name, personality);
    const { pet: saved, storage } = await savePet(pet);

    res.json({
      success: true,
      pet: saved,
      rootHash: saved.ogRootHash,
      storageInfo: storage
    });
  } catch (err) {
    console.error('Create pet error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/load/:rootHash', async (req, res) => {
  try {
    const { rootHash } = req.params;
    const pet = await loadPet(rootHash);
    res.json({ success: true, pet, rootHash });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.get('/personalities', (req, res) => {
  const { PERSONALITIES } = require('../services/aiPet');
  res.json({ personalities: Object.keys(PERSONALITIES).map(k => ({
    key: k,
    name: PERSONALITIES[k].name,
    emoji: PERSONALITIES[k].emoji,
    traits: PERSONALITIES[k].traits
  })) });
});

module.exports = router;
