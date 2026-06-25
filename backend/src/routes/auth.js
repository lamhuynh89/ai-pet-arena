const express = require('express');
const router = express.Router();
const { register, login, claimPet, getMyPets, getUserInfo } = require('../services/authService');

router.post('/register', (req, res) => {
  try {
    const { username, password, wallet } = req.body;
    const result = register(username, password, wallet);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const result = login(username, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

router.post('/claim', (req, res) => {
  try {
    const { token, rootHash } = req.body;
    if (!token || !rootHash) {
      return res.status(400).json({ error: 'token and rootHash required' });
    }
    const result = claimPet(token, rootHash);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/mypets', (req, res) => {
  try {
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'token required' });
    const pets = getMyPets(token);
    res.json({ success: true, pets, count: pets.length });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

router.get('/me', (req, res) => {
  try {
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'token required' });
    const info = getUserInfo(token);
    if (!info) return res.status(401).json({ error: 'invalid token' });
    res.json({ success: true, user: info });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

module.exports = router;
