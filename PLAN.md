# Implementation Plan: AI Pet Arena MVP

## Overview
Build full vertical MVP slices: project init + backend core + 0G service + AI engine + frontend UI + integration. Deliver runnable app with all required flows. Compatible with Node 18 / Win Server 2016.

## Architecture Decisions
- Use plain JS (no TS) for speed and broad Win compat.
- 0G via official TS SDK but consumed from JS (ESM/CJS careful).
- Mock AI for MVP (template + rule engine). Easy to swap.
- Backend holds minimal state (in-memory map of rootHash → latest). Real source of truth = 0G.
- Frontend uses localStorage for last rootHash + list. Calls backend only for AI/0G proxy (keeps keys server-side).
- Ports: Backend 3001, Frontend 5173. No conflict.
- Single active pet per session for MVP (no multi-pet UI yet).

## Task List (Vertical Slices)

### Phase 1: Foundation & Storage
- [ ] Task 1: Init backend + Express skeleton + health + pet model
- [ ] Task 2: Implement 0G storage service (uploadData + downloadFile wrapper + test keys)
- [ ] Task 3: Create AI pet engine (personalities + chat responder + stat decay)

### Checkpoint 1
- Backend starts, /health works
- Can upload/download JSON pet via 0G testnet (manual verify rootHash)

### Phase 2: Core Backend APIs
- [ ] Task 4: POST /pets/create → generate + 0G upload → return rootHash + pet
- [ ] Task 5: POST /chat → personality AI reply + update last interaction
- [ ] Task 6: POST /actions/feed | /train | /battle → mutate stats + re-upload to 0G

### Checkpoint 2
- Full CRUD flow through backend only (curl or postman)
- Battle returns winner + delta

### Phase 3: Frontend MVP
- [ ] Task 7: Init Vite React + basic routing/views (no router lib)
- [ ] Task 8: PetCreator component + create flow calling backend
- [ ] Task 9: PetDashboard + stats display + ChatWindow
- [ ] Task 10: ActionPanel (Feed/Train buttons) + BattleArena (simple vs AI)

### Checkpoint 3
- End-to-end: Browser create → chat 3 turns → feed/train → battle → see stat change + new rootHash

### Phase 4: Polish + Docs + Compat
- [ ] Task 11: Add rootHash reload (load previous pet)
- [ ] Task 12: Error handling + loading states + simple CSS
- [ ] Task 13: Write root README + .env.example + Win2016 run notes
- [ ] Task 14: Quick smoke test commands + package scripts

## Risks & Mitigations
| Risk                        | Level | Mitigation |
|-----------------------------|-------|------------|
| 0G SDK install on Win2016   | Med   | Use minimal deps. Fallback mock storage if SDK fails in test |
| Node 18 ESM/CJS interop     | Low   | Use .js + "type":"module" or CJS for backend |
| 0G testnet key/gas          | Med   | Document faucet. Provide mock mode via env |
| Personality AI too weak     | Low   | Hard 4 templates + random variation. Good enough MVP |
| Win2016 file paths          | Low   | Use path.join, no / in strings |

## Verification Order
1. Backend standalone (Task1-6)
2. 0G roundtrip test
3. Frontend standalone then connected
4. Full loop + reload from rootHash
5. Final: Run `npm run dev` both sides. Document.

## Files Touched (by phase)
Phase1: backend/package.json, backend/src/index.js, backend/src/services/ogStorage.js, backend/src/services/aiPet.js
Phase2: backend/src/routes/*.js , backend/src/services/petModel.js
Phase3: frontend/* (all new)
Phase4: README*, .env.example

## Next After MVP
- Real LLM integration (via skill or separate)
- Multi-pet + user sessions
- Pet images (base64 or 0G file)
- Deploy note
