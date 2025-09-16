# Backend (Node.js + Express + TypeScript)

Clean structure with routes → controllers → services.

## Setup
```bash
cd /home/macowen/Desktop/projects/news_app/backend
npm i
npm run dev
```

Server starts at `http://localhost:4000`.

### Routes
- GET `/health` → `{ ok: true }`
- GET `/news/:category` → aggregated news (mock until API keys configured)
- POST `/ai/search` → AI summary (mock until Gemini configured)


