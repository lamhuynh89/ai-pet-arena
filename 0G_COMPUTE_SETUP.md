# 0G Compute Sub-Account Setup Guide (ai-pet-arena)

**Project**: projects/ai-pet-arena  
**Purpose**: Fix "Sub-account not found" / "Account does not exist" errors for 0G Compute inference.  
**Date**: 2026-06-24

## Overview

0G Compute uses:
- **Main Ledger (Account)**: Deposit OG here first (min ~3 OG for creation).
- **Sub-Accounts**: Per-provider escrows. Created automatically on first `transfer-fund`. Funds here are used for inference calls. Provider deducts usage.

**Error "Sub-account not found"** usually means:
- No main ledger yet → run `add-account`
- No funds transferred to specific provider sub-account → run `transfer-fund`

## Prerequisites

1. Get testnet OG (≥ 3–5 OG recommended):
   - https://faucet.0g.ai
   - Or Google Cloud 0G faucet

2. Wallet with `PRIVATE_KEY` (testnet only, NEVER mainnet real funds).

3. Set in `backend/.env`:
   ```
   STORAGE_MODE=real
   AI_MODE=0g
   PRIVATE_KEY=0x...
   OG_NETWORK=testnet
   ```

4. Explorer: https://chainscan-galileo.0g.ai

## Recommended: One-Shot Setup Script (SDK)

```powershell
cd backend
node scripts/setup-0g-compute.js
```

This script does:
- Ensures main ledger (`addLedger` / `add-account`)
- Deposits extra
- Finds inference provider
- `transfer-fund` to provider sub-account (creates sub-account)
- Acknowledges provider signer

See `backend/scripts/setup-0g-compute.js` for implementation + `backend/scripts/README.md`.

## Manual / CLI Commands

### Option A: Using Project Scripts (Recommended)

After setting PRIVATE_KEY:

```powershell
# Full setup (add + fund sub-account)
cd backend
node scripts/setup-0g-compute.js

# Quick balance check
node scripts/check-balance.js
```

### Option B: Direct SDK Calls (in code or custom script)

See `backend/scripts/setup-0g-compute.js` source. Key calls:

```js
const broker = await createZGComputeNetworkBroker(wallet);
const L = broker.ledger;

// 1. Create main account (add-account)
try {
  await L.getLedger();
} catch {
  await L.addLedger(3);   // MIN 3 OG
}

// 2. Deposit to main
await L.depositFund(1);

// 3. Transfer to provider sub-account (this creates sub-account)
const provider = "0x..."; // from listService()
await L.transferFund(provider, 0.5, 'inference');

// 4. Acknowledge (often auto after transfer)
await broker.inference.acknowledgeProviderSigner(provider);
```

### Option C: 0g-compute-cli (if installed globally)

```bash
# Install (one time)
npm install -g @0gfoundation/0g-compute-ts-sdk
# or pnpm add -g ...

# Then use CLI
0g-compute-cli get-account
0g-compute-cli deposit --amount 5
0g-compute-cli transfer-fund --provider 0xa48f01287233509FD694a22Bf840225062E67836 --amount 1 --service inference
0g-compute-cli inference list-providers
0g-compute-cli get-sub-account --provider 0xa48f...
```

**Common provider (Galileo testnet example)**: `0xa48f01287233509FD694a22Bf840225062E67836` (Qwen)

## Step-by-Step: Create Sub-Account + Fund

### 1. Create Main Account (`add-account`)

```powershell
# Via script
node scripts/setup-0g-compute.js

# Or manual via SDK in node REPL / custom:
node -e '
  require("dotenv").config();
  const {createZGComputeNetworkBroker} = require("@0gfoundation/0g-compute-ts-sdk");
  const {ethers} = require("ethers");
  (async () => {
    const w = new ethers.Wallet(process.env.PRIVATE_KEY, new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai"));
    const b = await createZGComputeNetworkBroker(w);
    await b.ledger.addLedger(3);
    console.log("add-account OK");
  })();
'
```

### 2. Transfer Funds to Sub-Account (`transfer-fund`)

Must know provider address first:

```powershell
# List providers
node -e '
  require("dotenv").config();
  const {createZGComputeNetworkBroker} = require("@0gfoundation/0g-compute-ts-sdk");
  const {ethers} = require("ethers");
  (async () => {
    const w = new ethers.Wallet(process.env.PRIVATE_KEY, new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai"));
    const b = await createZGComputeNetworkBroker(w);
    const svcs = await b.inference.listService();
    console.dir(svcs.map(s => ({provider: s.provider, model: s.model})));
  })();
'
```

Then transfer:

```powershell
# Via script (auto picks)
node scripts/setup-0g-compute.js

# Manual:
node -e '
  ... same wallet/broker ...
  await b.ledger.transferFund("0xPROVIDER...", 0.5, "inference");
  console.log("transfer-fund OK");
'
```

After transfer, sub-account for that provider is created and funded.

## Verification

```powershell
cd backend
node scripts/check-balance.js
```

Expected:
- Ledger exists
- Provider balance > 0 for your target provider

Run inference test:
```powershell
AI_MODE=0g node smoke-0g.js
```

## Troubleshooting

- "Account does not exist" → run addLedger / add-account first.
- "Sub-account not found" or insufficient → run transfer-fund (min ~0.5–1 OG recommended per provider).
- Low balance → faucet again.
- Provider not acknowledged → transfer-fund usually auto-acks. Or call acknowledgeProviderSigner.
- Use `getProvidersWithBalance()` to inspect.

## Security

- Use ONLY testnet PRIVATE_KEY.
- Never commit .env or keys.
- Real mode spends gas + OG on every operation.
- Start with small amounts (0.5 OG).

## References

- Official docs: https://docs.0g.ai/developer-hub/building-on-0g/compute-network/account-management
- Inference: https://docs.0g.ai/developer-hub/building-on-0g/compute-network/inference
- SDK: https://github.com/0gfoundation/0g-compute-ts-sdk
- Starter: https://github.com/0glabs/0g-compute-ts-starter-kit
- Project scripts: `backend/scripts/setup-0g-compute.js` + `check-balance.js`

After setup → set `AI_MODE=0g` + restart server. Pet chat will use real decentralized inference (with mock fallback on error).

## Quick Commands Summary

| Action              | Script / Command                              |
|---------------------|-----------------------------------------------|
| Full setup          | `node scripts/setup-0g-compute.js`            |
| Check balance       | `node scripts/check-balance.js`               |
| Add main account    | `addLedger(3)` via SDK or CLI add-account     |
| Transfer to sub     | `transferFund(provider, amount, 'inference')` |
| List providers      | `broker.inference.listService()`              |
| Acknowledge         | `acknowledgeProviderSigner(provider)`         |

**Done. Sub-account ready for inference.**
