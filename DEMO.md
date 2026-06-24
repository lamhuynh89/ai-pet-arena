# AI Pet Arena - UI Demo Guide (Improved)

## ✅ What was improved (simple + professional)

- Clean dark modern UI (no heavy graphics)
- Large emoji pet avatar with colored borders per personality
- Progress bars for Hunger / Happiness / Energy / XP
- Clear card layout + responsive grid
- Better buttons (icons + labels), inputs, chat bubbles
- Personality selection as nice grid cards
- Visual feedback on battle win/lose
- Root hash shown cleanly
- Still 100% same functionality

## How to run (Windows)

### 1. Start Backend (terminal 1)
```powershell
cd C:\Users\opc\.openclaw\workspace-venture-lab\projects\ai-pet-arena\backend
npm run dev
```
Keep this running (port 3001).

### 2. Start Frontend (terminal 2)
```powershell
cd C:\Users\opc\.openclaw\workspace-venture-lab\projects\ai-pet-arena\frontend
npm run dev
```
Opens at: **http://localhost:5173**

### 3. Quick Demo Flow
1. Open http://localhost:5173
2. Enter pet name e.g. `Pixel`
3. Pick personality (Playful / Grumpy / Smart / Lazy)
4. Click **Create Pet & Save to 0G**
5. Watch stats + big emoji pet appear
6. Try:
   - Chat (type something, AI replies in character)
   - Feed → see Hunger/Happiness rise
   - Train → see XP rise, Energy drop
   - Battle → fight Shadow Fang, get WIN/LOSE + XP delta
7. Click **Reload from 0G** to test persistence
8. Click **New Pet** to reset

### How to Capture Screenshots (Windows)

**Option A - Built-in Snip & Sketch (recommended)**
- Press `Win + Shift + S`
- Drag over the browser window
- Click the notification to copy/save

**Option B - Full window**
- Press `Alt + PrtScn` (active window)
- Paste into Paint → Save as PNG

**Recommended shots for demo:**
1. `01-create-screen.png` — Pet Creator (name + personality grid)
2. `02-pet-dashboard.png` — Full dashboard after create (big pet + stats bars)
3. `03-chat.png` — Chat window in action
4. `04-battle-win.png` — Battle result (WIN screen)
5. `05-actions.png` — After Feed/Train (stats changed)

## Notes for Windows Server 2016
- Works with Node 18+
- Pure JS frontend, no native deps
- Use Edge or Chrome
- If port 5173 taken: `npm run dev -- --port 5174`

## Build for production (optional)
```powershell
cd frontend
npm run build
# Serve with: npx serve dist
```

All functionality unchanged. UI only refresh.
