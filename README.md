# AI Pet Arena - MVP

Tier 1 MVP: Create pet, personality-driven chat, feed/train, AI battles, persist to **0G Storage**.

**Tech**: React + Vite (frontend) + Node 18 + Express (backend) | 0G decentralized storage

**Target**: Runs on Windows Server 2016 (Node 18)

## Quick Start

### 1. Backend
```powershell
cd backend
npm install
cp .env.example .env
# Edit .env → leave as-is for mock (SAFE). Only add PRIVATE_KEY + STORAGE_MODE=real for real 0G
npm run dev
```
Server runs on http://localhost:3001

### 2. Frontend (new terminal)
```powershell
cd frontend
npm install
npm run dev
```
Opens on http://localhost:5173

### 3. Play
- Create pet (name + personality)
- Chat (AI answers in character)
- Feed / Train
- Battle vs fixed AI pet
- Data saved to 0G (root hash shown). Use "Reload from 0G" to fetch latest.

## 0G Setup (REAL mode - Giai doan 2)

### Prerequisites
- Get testnet OG (>=3 OG for ledger): https://faucet.0g.ai  or Google Cloud faucet
- Wallet with PRIVATE_KEY
- Explorer: https://chainscan-galileo.0g.ai

### Storage + Compute (backend/.env)
```
STORAGE_MODE=real
AI_MODE=0g
PRIVATE_KEY=0xYourTestnetKey
OG_NETWORK=testnet
```

### Fix "Sub-account not found" / "Account does not exist"

**Full dedicated guide**: see `0G_COMPUTE_SETUP.md` (step-by-step + scripts + troubleshooting).

Quick run:
```powershell
cd backend
node scripts/setup-0g-compute.js
```

This does (SDK):
- `addLedger(3)` (main account / add-account)
- `depositFund`
- `transferFund` to provider (creates sub-account)
- `acknowledgeProviderSigner`

### CLI alternative (after global install)
```powershell
0g-compute-cli add-account --amount 3
0g-compute-cli deposit --amount 1
0g-compute-cli transfer-fund --provider <PROV_ADDR> --amount 0.5 --service inference
0g-compute-cli inference acknowledge-provider --provider <PROV_ADDR>
```

### Run real mode
```powershell
# smoke test
STORAGE_MODE=real AI_MODE=0g node smoke-0g.js

# or server
npm run dev
```

**SECURITY**: Never commit PRIVATE_KEY. Real mode spends gas.

Mock (default): instant, no funds. Real: full decentralized Storage + Compute.

## Windows Server 2016 Setup + Test

**Node 18+ required** (engines field enforced in package.json).

1. Install Node 18.20+ (LTS recommended):
   - Download: https://nodejs.org/dist/latest-v18.x/node-v18.20.4-x64.msi (or newer 18.x)
   - Run installer as Administrator. Add to PATH.
   - Verify: `node -v` (must be >=18) and `npm -v`

2. Backend (PowerShell as Admin recommended for first install):
```powershell
cd C:\path\to\ai-pet-arena\backend
npm install
copy .env.example .env
# Do NOT edit PRIVATE_KEY unless doing real 0G test
npm run dev
```

For real 0G: after .env, run `node scripts/setup-0g-compute.js` (see 0G Setup section).

3. Frontend (new terminal):
```powershell
cd ..\frontend
npm install
npm run dev
```

**Smoke test commands (after both running)**:
- Health: curl http://localhost:3001/health   (or browser)
- Create pet: POST /pets/create with {name:"Test", personality:"playful"}
- Use frontend UI at http://localhost:5173
- After create: copy rootHash from response, test load + feed/train/battle

**Known Win2016 notes**:
- Use Node 18 MSI (no nvm)
- If npm install slow: `npm install --prefer-offline`
- 0G real upload may need extra time/network
- Run as local admin first time for port binding if UAC strict
- All deps pure JS + standard fs/crypto → no native rebuilds expected

## Project Structure
See SPEC.md + PLAN.md for details.

## Commands
- Backend: `npm run dev`
- Frontend: `npm run dev`

## Compatibility & Safety
- Node >=18 (enforced)
- Default STORAGE_MODE=mock (safe, no key needed)
- Pure JS (CJS backend) for fast Win2016 install
- .env never committed

Built for speed. After MVP: add real LLM, multi-pet, images.
