# QA Review: AI Pet Arena MVP
**Date**: 2026-06-24  
**Reviewer**: QA (subagent)  
**Project**: projects/ai-pet-arena/  
**Target**: The Zero Cup submission + Windows Server 2016 runtime  
**Coder claim**: React + Vite + Node 18 + Express + 0G Storage MVP complete

---

## VERDICT: **PASS (MVP) | CONDITIONAL PASS (Zero Cup)**

**MVP functional**: Yes. All SPEC success criteria met in mock mode.  
**Zero Cup ready**: No, without fixes (see Critical).  
**Win Server 2016 compatible**: Likely yes (no native binaries, Node 18+ target). Needs on-box test.

**Smoke test executed**: Backend services (create/save/load + AI engine) → PASS.

---

## 1. Code Quality & Architecture

**Strengths**:
- Follows SPEC.md + PLAN.md structure exactly.
- Clean layers: routes → services (aiPet, petModel, ogStorage).
- Pure JS (CJS backend, ESM frontend) — good for Win compat.
- Personality engine excellent for MVP: 4 distinct voices, context-aware variation, stat decay.
- State flow correct: mutate → re-upload → return new rootHash.
- Frontend simple, no heavy libs. Proxy setup clean. localStorage persistence.
- Error handling present at API level (try/catch + JSON errors).
- Build artifacts exist (frontend/dist).

**Weaknesses**:
- ogStorage.js download is stub (real mode always throws → relies on memoryStore).
- Real upload code uses low-level MemData/Uploader (SDK README shows different indexer patterns; risk of breakage).
- Hardcoded opponent in battle.
- No input sanitization beyond trim (name length?).
- Frontend: no loading spinners on all actions, no optimistic UI.
- Backend: memoryStore + in-process only (single instance, no clustering).
- Dupe personality list (hardcoded fallback in frontend + backend).
- No package.json "engines": { "node": ">=18" }.

**Score**: 7.5/10 (solid MVP, production polish missing).

---

## 2. MVP Feature Completeness (vs SPEC)

| Criteria                        | Status   | Notes |
|--------------------------------|----------|-------|
| Create pet (name + 4 pers)     | PASS    | Works, uploads to 0G |
| Chat 3+ turns, personality var | PASS    | Distinct tones + light context |
| Feed/Train update stats + XP   | PASS    | Decay + effects applied |
| Battle vs AI, win/lose + delta | PASS    | Power calc + luck |
| Persist + reload via rootHash  | PASS    | localStorage + /load endpoint |
| Stats decay on load/action     | PASS    | Time-based (hours) |
| Runs dev (3001/5173)           | PASS    | Vite proxy + express |
| 0G rootHash returned always    | PASS    | Mock or real |

**Missing per SPEC**:
- Real 0G roundtrip fully tested (download stub).
- Image for pets (explicit MVP: emoji ok).

---

## 3. Windows Server 2016 Compatibility

**Evidence**:
- No native modules (express, ethers, axios, cors, dotenv pure).
- 0G SDK: official >=18, cross-platform (fs/crypto standard). No Win-specific bugs in public.
- ethers v6: >=14, runs on Node 18/Win.
- Node 18 officially supported on WS2016 (runtime).
- Uses path.join in ogStorage.
- CJS backend (less ESM pitfalls).
- Vite build static (dist present).

**Risks**:
- 0G SDK real mode: network + crypto on old Win (test needed).
- npm install of @0gfoundation/0g-storage-ts-sdk + ethers on WS2016 (large deps).
- No "engines" field.
- .env.example uses STORAGE_MODE=real by default in code comments.

**Recommendation**: Run full `npm install && npm run dev` on actual WS2016 box before submit. Provide Node 18.20+ MSI note.

**Current verdict**: **Likely compatible**. No blockers found.

---

## 4. 0G Storage Integration

**Mock mode**: Excellent (instant, reliable for demo).
**Real mode**: Partial.
- Upload: attempts via MemData + Uploader. Falls back to fake hash.
- Download: **NOT IMPLEMENTED** — throws "download not fully implemented", relies on memoryStore.
- .env currently has real PRIVATE_KEY (security issue).
- SDK version 1.2.10 used.

**Issues**:
- Inconsistent with current SDK README (uses indexer.upload in examples).
- No proof verification.
- No .og-cache usage in real flow.
- Fallback always produces fake hash — users think data is on-chain.

**For Zero Cup**: Must either (a) fully implement download or (b) document "MVP uses mock for demo, real upload tested separately".

---

## 5. Security & Ops

- **CRITICAL**: backend/.env contains live PRIVATE_KEY. Even if testnet, never commit.
- .gitignore covers .env + node_modules + dist (good).
- No auth (MVP scope ok, single-user demo).
- No rate limiting / input size beyond 1mb json.
- Hardcoded testnet RPCs.
- No prod start script using PM2 or Windows service note.

---

## 6. Documentation & Runability

- README.md: Good quickstart, mock note present.
- SPEC.md + PLAN.md: Excellent (used for this review).
- .env.example: Exists but STORAGE_MODE=real default risky.
- No backend/README.md.
- Missing: explicit "test on Windows Server 2016" section + Node version pin.
- Dist built — frontend can be served statically.

**Run test (this env)**:
- Backend smoke (create/save/load + AI): **PASS**.
- Frontend: builds, proxy works.

---

## 7. The Zero Cup Readiness

**Ready**:
- Full vertical MVP slice complete.
- 0G integration (at least mock + upload).
- Personality + battle unique hook.
- Clean, presentable UI.
- Docs + structure.

**Blockers**:
1. Real PRIVATE_KEY committed in .env.
2. Real 0G download broken.
3. 0G code may be using outdated upload path.
4. No "engines" + Win2016 explicit test note.
5. No minimal test coverage or smoke script.
6. Default encourages real mode without funds.

**Score for submission**: 6.5/10. Fix 1-4 → 8.5/10.

---

## 8. Required Fixes (Prioritized)

**P0 (before submit)**:
- [ ] Delete real key from backend/.env. Add note in .env.example.
- [ ] Set default STORAGE_MODE=mock in .env.example + code comments.
- [ ] Fix or heavily document downloadPetData for real mode (or remove real claim).
- [ ] Add to package.json (both):
  ```json
  "engines": { "node": ">=18.0.0" }
  ```
- [ ] Add Win Server 2016 section to README: Node 18 MSI, test commands, known risks.

**P1**:
- [ ] Improve ogStorage: use ZgFile or match current SDK upload pattern. Add real download stub with note.
- [ ] Add simple backend health + flow test script (npm test).
- [ ] Frontend: show rootHash copy button, better error UX.
- [ ] Remove duplicate personality data.

**P2 (post-MVP)**:
- Real LLM swap path.
- Multi-pet.
- Proper 0G downloader class.
- Docker or Windows service guide.

---

## 9. Recommendations

- **For demo**: Always ship with `STORAGE_MODE=mock`. Document faucet link for real.
- **For Zero Cup**: Title as "MVP: Fully working AI Pet with 0G decentralized persistence (mock + real upload path)".
- Run on actual target Win Server 2016 before final.
- Consider adding `npm run build && npm run preview` smoke.
- After fixes: re-run full manual flow (create → 5 chat → feed x2 → train → battle → reload hash).

---

## Summary

**PASS** for internal MVP / local demo.  
**CONDITIONAL** for The Zero Cup — fix P0 items + retest 0G real path + Win box.

Code is better than average Tier-1 MVP. Core logic sound. Polish + security + 0G completeness needed for public submission.

**Next action for Coder**: Address P0 list, update README, commit clean .env.example only.

QA complete. Report saved to QA_REPORT.md.