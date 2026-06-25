const express = require('express');
const router = express.Router();
const { createPet, savePet, loadPet } = require('../services/petModel');
const { claimPet, isOwner, verifyToken } = require('../services/authService');

router.post('/create', async (req, res) => {
  try {
    const { name, personality, token } = req.body;
    if (!name || !personality) {
      return res.status(400).json({ error: 'name and personality required' });
    }
    const pet = createPet(name, personality);
    const { pet: saved, storage } = await savePet(pet);

    // Auto-claim if token provided (logged-in user creates)
    let claimed = false;
    if (token) {
      try {
        claimPet(token, saved.ogRootHash);
        claimed = true;
      } catch (e) { /* ignore claim fail, still return pet */ }
    }

    res.json({
      success: true,
      pet: saved,
      rootHash: saved.ogRootHash,
      storageInfo: storage,
      claimed
    });
  } catch (err) {
    console.error('Create pet error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/load/:rootHash', async (req, res) => {
  try {
    const { rootHash } = req.params;
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
    // Guest load allowed (public pet). Ownership check not enforced on load for now.
    const pet = await loadPet(rootHash);
    let owned = false;
    if (token) {
      try { owned = isOwner(token, rootHash); } catch {}
    }
    res.json({ success: true, pet, rootHash, owned });
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
