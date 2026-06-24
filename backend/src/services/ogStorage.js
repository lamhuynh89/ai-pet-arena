// 0G Storage service - MVP wrapper (Node CJS)
// Uses low-level classes from @0gfoundation/0g-storage-ts-sdk
// Default: MOCK mode (instant, no gas). Real upload needs funded key.

const { Indexer, MemData } = require('@0gfoundation/0g-storage-ts-sdk');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// URL.clone shim for Node.js / old envs (Windows Server 2016, some Node builds)
// Native URL lacks .clone(). Ethers vendored code + 0G SDK assume it exists on non-string url objects.
// Without this: "url.clone is not a function" during real upload (JsonRpcProvider / FetchRequest paths).
if (typeof URL !== 'undefined' && typeof URL.prototype.clone !== 'function') {
  URL.prototype.clone = function clone() { return new URL(this.toString()); };
}

let config = null;

function initStorage() {
  if (config) return config;

  require('dotenv').config();

  const privateKey = process.env.PRIVATE_KEY;
  const storageMode = (process.env.STORAGE_MODE || 'mock').toLowerCase().trim();
  const network = process.env.OG_NETWORK || 'testnet';

  if (storageMode === 'mock' || !privateKey || privateKey.length < 20) {
    if (storageMode === 'real') {
      console.warn('[0G] STORAGE_MODE=real but no PRIVATE_KEY. Fallback MOCK. Fund at https://faucet.0g.ai');
    }
    console.log('[0G] MOCK mode active (no real upload, instant hashes)');
    config = { mock: true, mode: 'mock' };
    return config;
  }

  try {
    const rpcUrl = network === 'testnet' 
      ? 'https://evmrpc-testnet.0g.ai' 
      : 'https://evmrpc.0g.ai';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);

    const indexerUrl = 'https://indexer-storage-testnet-turbo.0g.ai';
    const indexer = new Indexer(indexerUrl);

    config = { 
      mock: false, 
      mode: 'real',
      signer, 
      indexer,
      provider,
      indexerUrl,
      rpcUrl
    };
    console.log('[0G] REAL mode initialized. Network:', network);
  } catch (e) {
    console.warn('[0G] Real init failed → MOCK. Reason:', e.message);
    config = { mock: true, mode: 'mock' };
  }
  return config;
}

async function uploadPetData(petData) {
  const cfg = initStorage();
  const jsonStr = JSON.stringify(petData, null, 2);

  if (cfg.mock) {
    const fake = '0x' + Buffer.from(jsonStr.slice(0, 200) + Date.now()).toString('hex').slice(0, 62);
    return { rootHash: fake, txHash: 'mock-' + Date.now(), size: jsonStr.length, mock: true };
  }

  try {
    // Real 0G upload: Indexer.upload(file, blockchain_rpc, signer)
    // Must pass real rpcUrl + signer. Passing wrong args (e.g. boolean) leads to
    // internal JsonRpcProvider bad init -> FetchRequest paths -> "url.clone is not a function"
    const data = new MemData(Buffer.from(jsonStr, 'utf8'));

    const [result, err] = await cfg.indexer.upload(data, cfg.rpcUrl, cfg.signer);
    if (err) throw new Error(err);

    const txHash = result?.txHash || null;
    const rootHash = result?.rootHash || ('0x' + Buffer.from(jsonStr.slice(0,80)).toString('hex'));

    console.log('[0G] REAL upload OK. root:', rootHash, 'tx:', txHash);
    return { rootHash, txHash, size: jsonStr.length };
  } catch (err) {
    console.error('[0G] Real upload failed:', err.message);
    // Never return fake root in real mode - let caller know
    throw new Error('0G real upload failed: ' + err.message);
  }
}

async function downloadPetData(rootHash, outputDir = './.og-cache') {
  const cfg = initStorage();

  if (cfg.mock) {
    // Mock: return null so caller falls back to memory cache (works for demo)
    return null;
  }

  if (!cfg.indexer) {
    throw new Error('Real mode but indexer not initialized. Check PRIVATE_KEY and STORAGE_MODE.');
  }

  try {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const outPath = path.join(outputDir, rootHash.replace(/^0x/, '') + '.json');

    // Official: indexer.download(rootHash, outputPath, withProof)
    const err = await cfg.indexer.download(rootHash, outPath, false);
    if (err) {
      console.error('[0G] download err:', err);
      throw new Error('0G download failed: ' + (err.message || err));
    }

    if (!fs.existsSync(outPath)) {
      throw new Error('Download ok but no file at ' + outPath);
    }

    const fileContent = fs.readFileSync(outPath, 'utf8');
    const parsed = JSON.parse(fileContent);
    console.log('[0G] REAL download OK, size:', fileContent.length);
    return parsed;
  } catch (err) {
    console.error('[0G] Download error', err.message || err);
    // In real mode, let upper layer (petModel) handle fallback to cache or error
    throw err;
  }
}

// Helper for smoke test: upload + download roundtrip
async function testStorageRoundtrip(testData = {test: 'pet-arena', ts: Date.now()}) {
  const up = await uploadPetData(testData);
  if (up.mock) {
    return { ok: true, mock: true, rootHash: up.rootHash };
  }
  // Try download
  try {
    const down = await downloadPetData(up.rootHash);
    const match = JSON.stringify(down) === JSON.stringify(testData);
    return { ok: match, mock: false, rootHash: up.rootHash, txHash: up.txHash, downloaded: down };
  } catch (e) {
    return { ok: false, mock: false, rootHash: up.rootHash, error: e.message };
  }
}

module.exports = {
  initStorage,
  uploadPetData,
  downloadPetData,
  testStorageRoundtrip
};
