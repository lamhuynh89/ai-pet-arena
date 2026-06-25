const express = require('express');
const router = express.Router();
const { feedPet, trainPet, battle } = require('../services/aiPet');
const { loadPet, savePet } = require('../services/petModel');
const { isOwner } = require('../services/authService');

router.post('/feed', async (req, res) => {
  try {
    const { rootHash, token } = req.body;
    if (!rootHash) return res.status(400).json({ error: 'rootHash required' });

    // Ownership enforcement: require valid token + owner for protected action
    if (!token || !isOwner(token, rootHash)) {
      return res.status(403).json({ error: 'ownership required. Register, login, and claim pet first' });
    }

    let pet = await loadPet(rootHash);
    const result = feedPet(pet);
    const { pet: saved } = await savePet(result.pet);

    res.json({
      success: true,
      pet: saved,
      message: result.message,
      action: 'feed',
      rootHash: saved.ogRootHash
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/train', async (req, res) => {
  try {
    const { rootHash, token } = req.body;
    if (!rootHash) return res.status(400).json({ error: 'rootHash required' });

    if (!token || !isOwner(token, rootHash)) {
      return res.status(403).json({ error: 'ownership required. Register, login, and claim pet first' });
    }

    let pet = await loadPet(rootHash);
    const result = trainPet(pet);
    const { pet: saved } = await savePet(result.pet);

    res.json({
      success: true,
      pet: saved,
      message: result.message,
      action: 'train',
      rootHash: saved.ogRootHash
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/battle', async (req, res) => {
  try {
    const { rootHash, token } = req.body;
    if (!rootHash) return res.status(400).json({ error: 'rootHash required' });

    if (!token || !isOwner(token, rootHash)) {
      return res.status(403).json({ error: 'ownership required. Register, login, and claim pet first' });
    }

    let pet = await loadPet(rootHash);
    const result = battle(pet);   // vs built-in sample opponent
    const { pet: saved } = await savePet(result.pet);

    res.json({
      success: true,
      pet: saved,
      result: result.result,
      opponent: result.opponent,
      message: result.message,
      powerDelta: result.powerDelta,
      rootHash: saved.ogRootHash
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
