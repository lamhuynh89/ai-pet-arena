// AI Pet Arena - Backend (Node 18 + Express)
// Compatible with Windows Server 2016

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const petsRouter = require('./routes/pets');
const chatRouter = require('./routes/chat');
const actionsRouter = require('./routes/actions');

const { initStorage } = require('./services/ogStorage');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'ai-pet-arena-backend',
    time: new Date().toISOString(),
    storage: initStorage().mock ? 'mock' : '0g'
  });
});

// API routes
app.use('/pets', petsRouter);
app.use('/chat', chatRouter);
app.use('/actions', actionsRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[Backend] AI Pet Arena running on http://localhost:${PORT}`);
  console.log(`[Backend] 0G init...`);
  const s = initStorage();
  console.log(`[Backend] Ready. STORAGE_MODE=${s.mock ? 'mock' : 'real'}. NEVER put real PRIVATE_KEY in committed files.`);
});
