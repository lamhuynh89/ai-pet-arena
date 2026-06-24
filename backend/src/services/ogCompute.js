// 0G Compute service for AI Pet (real decentralized inference)
// Wraps @0gfoundation/0g-compute-ts-sdk
// Default: falls back to mock personality engine if AI_MODE=mock or no funds/key

const { ethers } = require('ethers');
const { createZGComputeNetworkBroker } = require('@0gfoundation/0g-compute-ts-sdk');

let broker = null;
let config = null;

function initCompute() {
  if (config) return config;

  require('dotenv').config();

  const privateKey = process.env.PRIVATE_KEY;
  const aiMode = (process.env.AI_MODE || 'mock').toLowerCase().trim();
  const network = process.env.OG_NETWORK || 'testnet';

  if (aiMode === 'mock' || !privateKey || privateKey.length < 20) {
    if (aiMode === '0g' || aiMode === 'real') {
      console.warn('[0G-Compute] AI_MODE=0g requested but no valid PRIVATE_KEY. Falling back to MOCK personality engine.');
    }
    config = { mock: true, mode: 'mock' };
    return config;
  }

  try {
    const rpcUrl = network === 'testnet' 
      ? 'https://evmrpc-testnet.0g.ai' 
      : 'https://evmrpc.0g.ai';

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Create broker (async init happens on first use)
    config = { 
      mock: false, 
      mode: '0g',
      wallet, 
      provider,
      network 
    };
    console.log('[0G-Compute] REAL mode config ready (broker lazy)');
  } catch (e) {
    console.warn('[0G-Compute] Init failed, MOCK fallback. Reason:', e.message);
    config = { mock: true, mode: 'mock' };
  }
  return config;
}

async function getBroker() {
  const cfg = initCompute();
  if (cfg.mock || broker) return { broker, cfg };

  try {
    broker = await createZGComputeNetworkBroker(cfg.wallet);
    console.log('[0G-Compute] Broker created successfully');
    return { broker, cfg };
  } catch (e) {
    console.error('[0G-Compute] Broker create failed:', e.message);
    cfg.mock = true;
    return { broker: null, cfg };
  }
}

async function getAvailableProviders() {
  const { broker } = await getBroker();
  if (!broker) return [];
  try {
    const services = await broker.inference.listService();
    return services || [];
  } catch (e) {
    console.warn('[0G-Compute] listService failed:', e.message);
    return [];
  }
}

/**
 * Call real 0G inference for pet reply.
 * Returns { reply, usedReal: true, provider?, model? }
 */
async function generateWithCompute(pet, userMessage, providerAddress = null) {
  const { broker, cfg } = await getBroker();
  if (!broker || cfg.mock) {
    return { reply: null, usedReal: false, reason: 'mock-mode-or-no-broker' };
  }

  try {
    // Auto pick first available inference service if not specified
    let targetProvider = providerAddress;
    if (!targetProvider) {
      const services = await broker.inference.listService();
      if (!services || services.length === 0) {
        throw new Error('No inference providers available on network');
      }
      // Prefer services with chat/inference capability (first one for MVP)
      targetProvider = services[0].provider || services[0].address || services[0];
    }

    // Ensure ledger + sub-account funded (best-effort)
    // If "Sub-account not found" or "Account does not exist": run setup script first
    try {
      await broker.ledger.depositFund(0.01);
    } catch (_) {}
    try {
      await broker.inference.acknowledgeProviderSigner(targetProvider);
    } catch (_) {}

    // Get metadata
    const meta = await broker.inference.getServiceMetadata(targetProvider);
    const endpoint = meta.endpoint || meta.serviceEndpoint;
    const model = meta.model || 'default';

    if (!endpoint) throw new Error('No endpoint in metadata');

    const headers = await broker.inference.getRequestHeaders(targetProvider);

    // Build personality prompt
    const systemPrompt = `You are ${pet.name}, a ${pet.personality} virtual pet. 
Traits: ${getPersonalityTraits(pet.personality)}.
Keep replies short (1-2 sentences), in character, fun for kids. 
Never break character. Current stats: hunger=${pet.stats.hunger}, happiness=${pet.stats.happiness}, energy=${pet.stats.energy}.`;

    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 80,
      temperature: 0.8
    };

    const resp = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Inference HTTP ${resp.status}: ${txt.slice(0,200)}`);
    }

    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || data.choices?.[0]?.text || null;

    return {
      reply,
      usedReal: true,
      provider: targetProvider,
      model
    };
  } catch (err) {
    console.warn('[0G-Compute] Inference failed, will fallback to mock:', err.message);
    return { reply: null, usedReal: false, reason: err.message };
  }
}

function getPersonalityTraits(key) {
  const map = {
    playful: 'bouncy, excited, loves fun, uses emojis',
    grumpy: 'sarcastic, short, complains a lot',
    smart: 'logical, precise, gives advice',
    lazy: 'slow, sleepy, prefers rest'
  };
  return map[key] || 'friendly pet';
}

module.exports = {
  initCompute,
  getBroker,
  getAvailableProviders,
  generateWithCompute
};
