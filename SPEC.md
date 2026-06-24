# Spec: AI Pet Arena MVP

## Objective
Build Tier-1 MVP for AI Pet Arena: web app where users create virtual pets with personalities, interact via chat (AI responses match personality), manage stats via Feed/Train, battle against sample AI pets, and persist pet data to 0G decentralized storage.

Users: Casual gamers / AI pet enthusiasts. 
Success: Fully functional local MVP runnable on Windows Server 2016. Create pet → chat → feed/train → battle → data stored/retrieved via 0G.

## Tech Stack
- Frontend: React 18 + Vite (ES modules, compatible)
- Backend: Node.js 18 + Express
- Storage: 0G Storage via @0gfoundation/0g-storage-ts-sdk (or starter kit) + ethers
- AI: Mock personality-driven responder (rule-based + templates for MVP speed; pluggable for real LLM later)
- Other: Axios (http), cors, dotenv. NO heavy deps. Pure JS/TS where possible.
- Compatibility: Target Node 18, run on Win Server 2016 (avoid native binaries that break old Win)

## Commands
Root (ai-pet-arena/):
- `cd backend && npm run dev`  → start Express on :3001
- `cd frontend && npm run dev` → start Vite on :5173
- `npm run build` (per package)
- `node backend/src/index.js` (prod start)

Install: 
- Backend: npm init -y ; npm i express cors dotenv axios @0gfoundation/0g-storage-ts-sdk ethers
- Frontend: npm create vite@latest . -- --template react ; npm i axios

## Project Structure
```
ai-pet-arena/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express server + routes mount
│   │   ├── routes/
│   │   │   ├── pets.js       # CRUD pet + upload to 0G
│   │   │   ├── chat.js       # Chat endpoint (personality AI)
│   │   │   ├── actions.js    # Feed, Train, Battle
│   │   ├── services/
│   │   │   ├── ogStorage.js  # 0G upload/download wrapper (JSON blobs)
│   │   │   ├── aiPet.js      # Personality engine + battle logic
│   │   │   └── petModel.js   # In-mem + 0G sync helpers
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── PetCreator.jsx
│   │   │   ├── PetDashboard.jsx
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── ActionPanel.jsx
│   │   │   └── BattleArena.jsx
│   │   ├── services/
│   │   │   └── api.js        # axios calls to backend
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── README.md
├── SPEC.md
├── PLAN.md
├── .gitignore
└── README.md
```

## Code Style
- JS/JSX only (no TS for MVP speed / Win compat)
- Async/await everywhere for 0G
- Small pure functions for AI logic
- Error handling: try/catch + JSON {error}
- Pet object shape:
  ```js
  {
    id: "uuid",
    name: "Fluffy",
    personality: "playful" | "grumpy" | "smart" | "lazy",
    stats: { hunger: 80, happiness: 70, energy: 60, xp: 120 },
    createdAt: "2026-..",
    lastUpdated: "...",
    ogRootHash: "0xabc..."   // 0G ref
  }
  ```
- Personality templates drive responses.

## Testing Strategy
MVP Tier1: Manual + smoke. 
- Manual: Run dev, create pet, chat 5 msgs, feed/train 3x, run 2 battles, verify data roundtrip via 0G.
- No unit tests yet (post-MVP).
- Verify: Backend health, frontend loads, console no critical errors.
- Future: Add vitest + supertest.

## Boundaries
- Always: Use .env for keys, log rootHash on every store, validate personality enum.
- Ask first: Add real LLM (OpenAI etc), change port, add auth.
- Never: Hardcode private keys, use fs for pet prod data, ship without 0G integration.

## Success Criteria
- [ ] Can create pet with name + personality (4 options)
- [ ] Chat: 3+ turns, responses vary by personality (different tone/vocab)
- [ ] Stats visible, decrease on time or actions; Feed/Train update stats + xp
- [ ] Battle: Pick own pet vs fixed AI opponent, simple win/lose + stat impact
- [ ] Data persisted: After create/action, rootHash returned; reload from hash fetches correct state
- [ ] Runs on Win Server 2016: node 18 + npm i succeeds, no native module crashes
- [ ] README with exact run steps + 0G testnet setup

## Open Questions
- Real LLM key or stay mock? (MVP: stay mock + comment for upgrade)
- 0G mainnet or testnet? (Use testnet + faucet note)
- Multiple pets per user? (MVP: single active pet, list later)
- Image for pets? (MVP: emoji or simple CSS pet, no upload)

## MVP Pet Personalities (hardcoded)
1. Playful: Bouncy, excited, uses ! and emojis in replies
2. Grumpy: Short, sarcastic, complains about actions
3. Smart: Logical, gives advice, uses big words
4. Lazy: Slow, sleepy replies, prefers rest over action

## Data Flow
Create → generate pet JSON → uploadData to 0G → save rootHash locally (localStorage + backend mem for demo) 
Retrieve: fetch by rootHash → download → hydrate UI
Actions: mutate stats locally, then push new JSON to 0G → update rootHash

## Risks
- 0G SDK on Win2016/Node18: Test install first.
- AI quality: Mock only. Document upgrade path.
- No real auth: Single user local demo ok for MVP.
