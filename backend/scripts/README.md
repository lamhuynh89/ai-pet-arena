# 0G Compute Scripts

## setup-0g-compute.js

One-shot fix for "Sub-account not found" and "Account does not exist".

### Prerequisites
- Wallet with >= 3 OG on Galileo testnet (faucet.0g.ai)
- PRIVATE_KEY in .env or env var

### Run
```powershell
cd backend
node scripts/setup-0g-compute.js
```

### What it does (SDK calls)
1. `broker.ledger.addLedger(3)` - creates main ledger/account
2. `broker.ledger.depositFund(1)` - add balance
3. `broker.inference.listService()` - find providers
4. `broker.ledger.transferFund(provider, 0.5, 'inference')` - fund sub-account (this fixes the error)
5. `broker.inference.acknowledgeProviderSigner(provider)` - required for headers

### Windows Server 2016
- Pure Node (no extra binaries)
- Works with Node 18+ (project engine)
- Use full `node scripts/setup-0g-compute.js`

### After success
- Set `AI_MODE=0g` (and `STORAGE_MODE=real` if want storage too)
- Run `node smoke-0g.js` or start server
- Chat will use real 0G Compute (fallback if still issues)

### Manual CLI (if global 0g-compute-cli installed)
```powershell
0g-compute-cli add-account --amount 3
0g-compute-cli deposit --amount 1
0g-compute-cli transfer-fund --provider 0x... --amount 0.5 --service inference
0g-compute-cli inference acknowledge-provider --provider 0x...
```

See root README + `../0G_COMPUTE_SETUP.md` (new dedicated guide with exact add-account / transfer-fund flows) + backend/.env.example for full flow.

## Key Sub-Account Commands (Summary)

- add-account (main ledger): `addLedger(3)` or `0g-compute-cli add-account --amount 3`
- transfer-fund (creates provider sub-account): `transferFund(provider, amount, 'inference')`

Full details + troubleshooting in `0G_COMPUTE_SETUP.md`.
