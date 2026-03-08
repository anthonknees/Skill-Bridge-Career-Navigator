# Skill-Bridge Career Navigator

## Overview

Skill-Bridge is a career navigation platform where you paste your resume, pick a target job role, and instantly see which skills you have, which you're missing, and a prioritized learning roadmap to close the gap. The analysis is powered by OpenAI GPT-4o-mini with a full rule-based fallback so the app works even without an API key.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, React Router v6
- **Backend:** Node.js, Express 5
- **AI:** OpenAI API (GPT-4o-mini)
- **Testing:** Vitest + Supertest (36 tests, TDD methodology)

## Getting Started

### Prerequisites

- Node.js >= 18
- An OpenAI API key (optional — fallback mode works without one)

### Installation

```bash
# 1. Clone the repo
git clone <repo-url>
cd skill-bridge

# 2. Install all dependencies
npm run install:all

# 3. Configure environment
cp server/.env.example server/.env
# Edit server/.env and add your OPENAI_API_KEY (optional)

# 4. Start both servers
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## User Flow

1. **Home page** — Paste your resume text (or load one of 5 sample profiles from the dropdown), then pick a target job role from the selector.
2. **Gap Analysis** — See your match percentage, which skills you already have (green), and which you're missing (red). In AI mode, missing skills include importance ratings and explanations.
3. **Learning Roadmap** — Get a prioritized list of skills to learn with course recommendations. Click each card to toggle its status: Not Started → In Progress → Completed.

## AI Integration

**AI Mode:** OpenAI GPT-4o-mini extracts skills from your resume text, compares them against the job description's required skills, and generates a prioritized learning roadmap with reasoned recommendations.

**Fallback Mode:** If the OpenAI API is unavailable, rate-limited, or returns an error, the app automatically falls back to a rule-based system — no error is shown to the user. The fallback uses tokenized keyword matching against `skills_taxonomy.json` (which maps aliases like "ReactJS" → "React") for skill extraction, direct set comparison for gap analysis, and static course lookups from `courses.json` for the roadmap.

**Toggle:** The AI/Fallback toggle in the top-right header lets you force fallback mode for demo purposes. An amber banner appears when fallback is active. The response always includes a `mode` field (`"ai"` or `"fallback"`) displayed as a badge in the UI.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/jobs` | List job descriptions; filter by `?category=` and `?search=` |
| `POST` | `/api/analyze-resume` | Extract skills from resume and compare to target role |
| `POST` | `/api/generate-roadmap` | Generate prioritized learning roadmap for missing skills |
| `GET` | `/api/samples` | Return sample resume profiles for demo |
| `GET` | `/api/health` | Health check |

All AI routes accept `?forceMode=fallback` to bypass AI and use fallback directly.

## Testing

```bash
# Run all 36 tests
cd server && npm test

# Watch mode during development
cd server && npm run test:watch
```

### Test breakdown (36 tests across 6 files)

| File | Tests | What it covers |
|------|-------|----------------|
| `data.test.js` | 13 | Synthetic JSON files have valid structure and required fields |
| `services/fallbackService.test.js` | 8 | Skill extraction (including alias resolution), gap analysis (0%/100%/partial), roadmap generation |
| `services/aiService.test.js` | 4 | OpenAI extractSkills/analyzeGap/generateRoadmap with mocked API calls; throws on failure |
| `routes/jobs.test.js` | 3 | GET /api/jobs — all jobs, category filter, keyword search |
| `routes/analyze.test.js` | 6 | Valid response shape, 400 on empty input, 400 on missing role, 413 on oversized input, fallback mode, AI mode |
| `routes/roadmap.test.js` | 2 | Valid roadmap shape, empty missingSkills returns empty array |

## Security

- API keys are in `.env` (not committed) — see `.env.example`
- All data is synthetic — no real PII anywhere
- Input validation on all routes (400/413 on bad input)
- Rate limiting: 50 req/min on all `/api/` routes, 10 req/min on AI routes (`express-rate-limit`)
- Resume text capped at 10,000 characters (returns HTTP 413 if exceeded)
- Input trimmed of whitespace before processing

## Future Enhancements

- [ ] Real job board API integration (LinkedIn, Indeed)
- [ ] User accounts and persistent progress tracking
- [ ] PDF resume upload with text extraction
- [ ] Mock interview question generation per skill gap
- [ ] Skill trend data (which skills are growing in demand)
