# Trendella Gift Recommender

Full-stack React + Express application that curates gift ideas via chat, surfaces affiliate-ready product cards from Amazon, AliExpress, and SHEIN, and lets shoppers maintain a session-level wish list.

## Stack

- **Frontend:** React 18 (Vite + TypeScript), Tailwind CSS, React Router, React Query
- **Backend:** Node.js 20, Express, TypeScript, Zod validation, Axios
- **Shared:** Affiliate adapters with in-memory caching and scoring, session wish list storage, LLM orchestrator with heuristic fallback

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Environment

Create `.env` files from the provided examples:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Populate the affiliate tag placeholders with your real partner IDs. `LLM_API_URL` and `LLM_API_KEY` are optional; when omitted the backend uses a deterministic heuristic to build product queries and explanations.

### Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend (in a separate shell)
cd ../client
npm install
```

### Development

Run the backend API:

```bash
cd server
npm run dev
```

By default the server listens on `http://localhost:5000` and enables CORS for the origins listed in `ORIGIN_ALLOWLIST`.

Run the Vite dev server:

```bash
cd client
npm run dev
```

Visit `http://localhost:5173` to use the app. The frontend proxies requests to the API base defined by `VITE_API_URL` (defaults to the local server).

### Production Build

```bash
# Backend
cd server
npm run build

# Frontend
cd client
npm run build
```

Generated assets live in `client/dist` and `server/dist`.

## Key Features

- Conversational intake that captures age, gender, occasion, budget, relationship, interests, color, and brand preferences before prompting for extra refinement.
- Backend orchestrator converts the profile into a product query spec, fans out to store adapters (with per-spec LRU caching), and re-ranks results with budget and profile scoring.
- Real product cards with affiliate-safe links, rating, price, store badge, and “Why this pick” explanations.
- Quick refinement chips and persisted wish list that can trigger another recommendation pass.
- Theme toggle with localStorage persistence and accessible focus states.

## Testing & Verification

- `npm run build` (server) runs TypeScript compilation to verify backend types.
- `npm run build` (client) runs TypeScript + Vite production build for the frontend bundle.

Consider adding integration tests around the recommendation endpoint once real affiliate APIs are wired up.
