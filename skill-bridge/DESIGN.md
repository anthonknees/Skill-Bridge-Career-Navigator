# Skill-Bridge — Design Document

## Architecture Overview

Skill-Bridge is a monorepo with a React frontend and an Express backend. They communicate over a REST API; no database is used — all data lives in synthetic JSON files.

```
skill-bridge/
├── client/          React + Vite + Tailwind (SPA)
├── server/          Node.js + Express (REST API)
└── data/            Synthetic JSON files (no DB)
```

### Request flow

```
Browser
  → Vite dev proxy (/api/* → localhost:3001)
    → Express route
      → Validation middleware (trim, 10k char cap)
      → Rate limiter (50/min general, 10/min AI routes)
      → try: AI service (OpenAI GPT-4o-mini)
        catch: Fallback service (keyword matching)
      → JSON response { ..., mode: "ai" | "fallback" }
```

---

## Backend Design

### Service separation

Two service modules are completely independent of each other:

**`services/aiService.js`** — thin wrapper around the OpenAI API. Each function constructs a prompt, calls `gpt-4o-mini`, parses the JSON response, and returns the result — or throws on any error. It has no fallback logic of its own.

**`services/fallbackService.js`** — pure functions with no external I/O at call time (data is loaded once at module init). Skill extraction tokenizes the resume text and matches against `skills_taxonomy.json` using word-boundary regex, resolving aliases (e.g. "ReactJS" → "React"). Gap analysis is a set comparison against the job's `required_skills`. Roadmap generation looks up `courses.json`.

### Route handlers

Each AI-powered route follows the same pattern:

```js
if (req.query.forceMode !== 'fallback') {
  try {
    // call aiService → return with mode: "ai"
  } catch {
    // fall through — never surface AI errors to the user
  }
}
// call fallbackService → return with mode: "fallback"
```

The `forceMode=fallback` query parameter is how the frontend toggle forces fallback mode for demo purposes without faking an API failure.

### Middleware stack

- `express.json()` — body parsing
- `generalLimiter` — 50 req/min on all `/api/` routes
- `aiLimiter` — 10 req/min on the two AI-powered routes
- `sanitizeResumeInput` — trims `resumeText`, rejects with HTTP 413 if over 10,000 characters

Middleware runs in this order: rate limiter → sanitizer → route handler. Rate limiting is checked before any expensive work.

---

## Frontend Design

### State and navigation

Global state is minimal: just the `useAI` boolean toggle, held in `App.jsx` and passed as a prop to pages. Result data flows forward through React Router's location state (`navigate('/analysis', { state: { analysis } })`), which avoids a global store while keeping the flow linear.

### Component breakdown

| Component | Responsibility |
|-----------|---------------|
| `App.jsx` | Router, header, AI/Fallback toggle |
| `ResumeInput.jsx` | Textarea + char counter, sample loader, job selector, submit |
| `GapAnalysis.jsx` | Match %, skill pills (matched/missing), mode badge, AI importance labels |
| `Roadmap.jsx` | Priority-ordered skill cards, course listings, click-to-cycle status |
| `pages/HomePage.jsx` | Orchestrates ResumeInput, calls analyzeResume, navigates on success |
| `pages/AnalysisPage.jsx` | Displays GapAnalysis, triggers roadmap generation |
| `pages/RoadmapPage.jsx` | Displays Roadmap, back-navigation |

### Normalizing AI vs. fallback shapes

In AI mode, `missingSkills` is an array of objects `{ skill, importance, reason }`. In fallback mode it is an array of strings. `GapAnalysis.jsx` normalizes both at render time:

```js
missingSkills.map(s => typeof s === 'string' ? { skill: s } : s)
```

This keeps the route handlers clean (they return what the service gives them) and puts the presentation concern in the presentation layer.

---

## TDD Approach

Every feature was built using the RED → GREEN → REFACTOR cycle:

1. **Write a failing test first.** The test defines the contract — what the function/route should accept and return. Running it before implementation confirms it fails for the right reason (not found, not a function, etc.).

2. **Write the minimum code to pass.** No extra features, no "I'll need this later" code. The goal is a green test, nothing more.

3. **Refactor with a green safety net.** Once tests pass, structure can be improved (e.g. extracting the shared `callAI` helper in `aiService.js`) without risking regressions.

Tests were never skipped or written after the fact. The 36-test suite was built incrementally across 4 phases and covers the full stack from data validation to integration.

### Testing strategy highlights

**Co-located tests** — every test file lives next to its source file. This makes it obvious when a source file has no tests and keeps context local when reading tests.

**Integration tests over unit tests for routes** — the route tests use `supertest` against the real Express app (not a mocked router). This catches middleware ordering bugs (e.g. rate limiter running after the handler, sanitizer not being applied) that pure unit tests would miss.

**Mocking at the boundary** — `aiService.test.js` mocks the `openai` module constructor. The route integration tests (`analyze.test.js`) mock `aiService.js` as a module. Nothing below the mock is tested in those tests — the real OpenAI API is never called during CI.

**Default-to-fallback in route tests** — `beforeEach` sets `aiService.extractSkills.mockRejectedValue(...)` so all existing tests run through the fallback path. Only the specific "AI mode" test overrides this. This means adding AI integration never broke the existing route tests.

---

## Key Trade-offs

### JSON files instead of a database

**Decision:** All data lives in flat JSON files in `/data/`. The fallback service reads them once at module init; the jobs route filters in memory.

**Why:** This is an MVP with synthetic data. A database would add setup friction, schema migrations, and a runtime dependency without adding any real value at this scope.

**Cost:** No persistence (user progress resets on page reload), no querying at scale. Acceptable for a demo.

### Automatic fallback — never return an AI error to the user

**Decision:** If the OpenAI call throws for any reason (network error, auth failure, rate limit, malformed JSON response), the catch block silently uses the fallback service. The user sees a valid result with `mode: "fallback"`.

**Why:** The fallback always produces a usable result. Showing users an error because an internal API call failed is a poor experience and reveals implementation details they don't need to know.

**Cost:** Silent failures are harder to debug in production. In a production system you'd log the error and emit a metric; here we accept that trade-off for simplicity.

### Module-level singleton avoidance in aiService

**Decision:** `aiService.js` creates a new `OpenAI` client inside each function call via `getClient()` rather than as a module-level constant.

**Why:** Vitest's module mocking replaces the `OpenAI` constructor mock before each test. If the client were created once at module load time, the mock wouldn't affect it. This pattern makes the service testable without requiring `vi.resetModules()` between every test.

**Cost:** Marginally more object allocation per request. Negligible for this traffic level.

### No global state manager (no Redux/Zustand)

**Decision:** The `useAI` toggle is passed as a prop; analysis and roadmap data travel via React Router's `location.state`.

**Why:** Three pages, one piece of global state. A store would be more boilerplate than the problem warrants.

**Cost:** If the user navigates directly to `/analysis` without going through the home page, `location.state` is null and they see a graceful empty state with a "go back" link. This is the right behavior for a URL-first app.

### forceMode query param instead of a separate endpoint

**Decision:** `?forceMode=fallback` on the existing endpoints bypasses AI, rather than having separate `/api/analyze-resume/fallback` endpoints.

**Why:** Keeps the API surface small. The toggle is a demo affordance, not a production feature — it doesn't deserve its own endpoint.

**Cost:** A query param that affects server-side behavior is slightly unusual. It's only used by the frontend toggle; external callers hitting the API directly would not know about it without reading docs.
