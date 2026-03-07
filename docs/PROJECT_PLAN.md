# Skill-Bridge Career Navigator — Project Plan

> **Purpose of this document:** This is the implementation blueprint for the Skill-Bridge Career Navigator project. It is designed to be fed directly to an AI coding assistant (e.g., Claude Code) as starting context. Every section is written to be actionable — not aspirational.

---

## 1. Project Summary

**What we're building:** A web-based career navigation platform that accepts a user's resume (or manual skill input), compares it against real job descriptions, identifies skill gaps, and generates a personalized learning roadmap — all powered by AI with a rule-based fallback.

**Who it's for:**
- Recent graduates trying to understand which skills/certs make them competitive
- Career switchers identifying transferable skills across industries
- Mentors looking for data-backed guidance tools

**One-line pitch:** "Paste your resume, pick your dream role, and get a concrete plan to close the gap."

---

## 2. Decisions Log (Locked In)

These decisions are final. Do not revisit during implementation.

| Decision            | Choice                        | Rationale                                                                 |
|---------------------|-------------------------------|---------------------------------------------------------------------------|
| Frontend framework  | React (Vite)                  | Fast scaffolding, widely understood, great for SPAs                       |
| Backend framework   | Node.js + Express             | Shares language with frontend, simple REST API setup                      |
| AI provider         | OpenAI API (GPT-4o-mini)      | Cost-effective, strong at structured JSON output, well-documented         |
| Database            | None (JSON file storage)      | MVP scope — no need for persistence complexity. Synthetic data in repo    |
| Styling             | Tailwind CSS                  | Rapid prototyping, consistent design, no custom CSS files needed          |
| Testing             | Vitest (unit + integration), TDD methodology | Tests written BEFORE code. Co-located with source files. ~15+ tests   |
| Deployment          | Local only (localhost)        | Challenge doesn't require hosted deployment                               |

---

## 3. Feature Scope (MVP Only)

### ✅ Building (required for submission)

1. **Resume Input Flow**
   - Text paste input (primary)
   - Optional: PDF upload with text extraction
   - Manual skill tag entry as alternative

2. **Gap Analysis Dashboard**
   - AI parses user skills from resume text
   - Compares against job description dataset (synthetic JSON)
   - Displays: matched skills, missing skills, match percentage
   - Visual skill comparison (bar chart or radar chart)

3. **Dynamic Learning Roadmap**
   - AI generates ordered list of recommended courses/projects per missing skill
   - Each recommendation includes: title, provider, estimated time, free/paid flag
   - User can mark items as "completed" or "in progress" (state only, no persistence)

4. **AI Integration + Rule-Based Fallback**
   - **AI mode:** OpenAI extracts skills from resume, matches against JDs, generates roadmap
   - **Fallback mode:** Keyword-matching algorithm (TF-IDF style or exact match against a skills taxonomy) activates when API is unavailable, rate-limited, or returns an error
   - Toggle in UI to switch between AI and fallback (for demo/reviewer purposes)

5. **Search & Filter**
   - Filter job roles by category (e.g., Frontend, Backend, Data, Cloud)
   - Search job descriptions by keyword

### ❌ Not Building (out of scope)

- User accounts / authentication
- Real job board API integrations (we use synthetic data)
- Mock interview feature (listed as "inspiration" in brief)
- Database persistence
- Deployment / hosting

---

## 4. Technical Architecture

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│              React + Vite + Tailwind         │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Resume   │  │   Gap    │  │  Roadmap  │  │
│  │  Input    │→ │ Analysis │→ │  Builder  │  │
│  │  Page     │  │Dashboard │  │   Page    │  │
│  └──────────┘  └──────────┘  └───────────┘  │
└───────────────────┬─────────────────────────┘
                    │ REST API calls
┌───────────────────▼─────────────────────────┐
│                  Backend                     │
│             Node.js + Express                │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │         API Routes                   │    │
│  │  POST /api/analyze-resume            │    │
│  │  POST /api/generate-roadmap          │    │
│  │  GET  /api/jobs?role=X&search=Y      │    │
│  └──────────┬───────────────────────────┘    │
│             │                                │
│  ┌──────────▼──────────┐  ┌──────────────┐   │
│  │   AI Service        │  │  Fallback    │   │
│  │   (OpenAI API)      │  │  Service     │   │
│  │                     │  │  (keyword    │   │
│  │  - Skill extraction │  │   matching)  │   │
│  │  - Gap analysis     │  │              │   │
│  │  - Roadmap gen      │  │              │   │
│  └─────────────────────┘  └──────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  Synthetic Data (JSON files)         │    │
│  │  - job_descriptions.json             │    │
│  │  - skills_taxonomy.json              │    │
│  │  - sample_resumes.json               │    │
│  │  - courses.json                      │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

---

## 5. Data Design (Synthetic)

All data is synthetic. No scraping. Ship these JSON files in `/data/`.

### job_descriptions.json
```json
[
  {
    "id": "jd-001",
    "title": "Cloud Engineer",
    "company": "Synthetic Corp",
    "category": "Cloud",
    "required_skills": ["AWS", "Terraform", "Docker", "Kubernetes", "CI/CD", "Python", "Linux", "Networking"],
    "nice_to_have": ["GCP", "Ansible", "Prometheus"],
    "description": "We are looking for a Cloud Engineer to design and manage..."
  }
]
```
**Target:** 15–25 job descriptions across 4–5 role categories.

### skills_taxonomy.json
```json
{
  "AWS": { "category": "Cloud", "aliases": ["Amazon Web Services", "aws"], "related": ["GCP", "Azure"] },
  "React": { "category": "Frontend", "aliases": ["ReactJS", "React.js"], "related": ["Vue", "Angular"] }
}
```
**Purpose:** Powers the fallback keyword matcher. Maps aliases and categories.

### sample_resumes.json
```json
[
  {
    "id": "resume-001",
    "name": "Alex Demo",
    "summary": "Recent CS graduate with experience in...",
    "skills": ["Python", "JavaScript", "SQL", "Git", "HTML", "CSS"],
    "experience": [
      { "title": "Intern — Software Dev", "company": "StartupCo", "duration": "3 months" }
    ],
    "education": "B.S. Computer Science, State University, 2024"
  }
]
```
**Purpose:** Pre-loaded demo profiles for reviewers to test without typing.

### courses.json
```json
[
  {
    "skill": "AWS",
    "courses": [
      { "title": "AWS Cloud Practitioner Essentials", "provider": "AWS", "url": "#", "hours": 6, "free": true },
      { "title": "AWS Solutions Architect Associate", "provider": "Udemy", "url": "#", "hours": 40, "free": false }
    ]
  }
]
```

---

## 6. API Design

### POST /api/analyze-resume
**Input:** `{ "resumeText": "string", "targetRole": "string" }`
**Output:**
```json
{
  "extractedSkills": ["Python", "JavaScript", "SQL"],
  "targetSkills": ["AWS", "Terraform", "Docker", "Python", "Linux"],
  "matchedSkills": ["Python"],
  "missingSkills": ["AWS", "Terraform", "Docker", "Linux"],
  "matchPercentage": 20,
  "mode": "ai" | "fallback"
}
```

### POST /api/generate-roadmap
**Input:** `{ "missingSkills": ["AWS", "Docker"], "timeframe": "3 months" }`
**Output:**
```json
{
  "roadmap": [
    {
      "skill": "Docker",
      "priority": 1,
      "reason": "Foundational for cloud roles",
      "courses": [ ... ],
      "estimatedWeeks": 2
    }
  ],
  "mode": "ai" | "fallback"
}
```

### GET /api/jobs
**Query params:** `?category=Cloud&search=terraform`
**Output:** Filtered array from job_descriptions.json

---

## 7. AI Prompts (Draft)

### Skill Extraction Prompt
```
You are a resume analysis assistant. Extract technical skills from the following resume text.

Return ONLY a JSON array of skill names. Be specific (e.g., "React" not "frontend frameworks").
Include programming languages, tools, platforms, frameworks, and methodologies.

Resume:
---
{resumeText}
---

Output format: ["skill1", "skill2", ...]
```

### Gap Analysis Prompt
```
You are a career advisor AI. Compare the candidate's skills against the target role requirements.

Candidate skills: {extractedSkills}
Target role: {targetRole}
Required skills for this role: {requiredSkills}

For each missing skill, briefly explain why it matters for this role (1 sentence).

Return JSON:
{
  "matched": [...],
  "missing": [{ "skill": "AWS", "importance": "high|medium|low", "reason": "..." }],
  "matchPercentage": number
}
```

### Roadmap Generation Prompt
```
You are a learning path advisor. Create a prioritized study roadmap for these missing skills.
The user wants to be job-ready within {timeframe}.

Missing skills: {missingSkills}

For each skill, suggest 1–2 specific learning resources (real or plausible course names).
Order by priority (foundational skills first, specialized skills later).

Return JSON array:
[{ "skill": "...", "priority": 1, "reason": "...", "estimatedWeeks": 2,
   "courses": [{ "title": "...", "provider": "...", "hours": 10, "free": true }] }]
```

---

## 8. Fallback Logic (When AI Is Unavailable)

The fallback MUST produce usable results without any AI API call.

### Skill Extraction Fallback
1. Tokenize resume text (lowercase, split on whitespace/punctuation)
2. Match tokens against `skills_taxonomy.json` keys and aliases
3. Return matched skill names

### Gap Analysis Fallback
1. Load target role's `required_skills` from `job_descriptions.json`
2. Compare against extracted skills (case-insensitive, alias-aware)
3. Return matched/missing arrays and simple percentage

### Roadmap Fallback
1. For each missing skill, look up `courses.json`
2. Sort by a hardcoded priority map (e.g., foundational > specialized)
3. Return static course recommendations

---

## 9. Build Order (Test-Driven Development)

**Methodology:** Test-Driven Development (TDD). For every piece of functionality, the cycle is:
1. **RED** — Write the test first. It should fail because the feature doesn't exist yet.
2. **GREEN** — Write the minimum code to make the test pass.
3. **REFACTOR** — Clean up the code while keeping the test green.

Never move to the next feature until the current feature's tests pass. Run `npm test` after every change.

> **Instruction for Claude Code:** After building each feature within a phase, immediately write its corresponding tests and run them. Do not proceed to the next feature until tests pass. If a test fails, fix the code before moving on.

---

### Phase 1: Project Scaffold + Test Infrastructure (30 min)
- [ ] Initialize monorepo: `/client` (Vite + React) and `/server` (Express)
- [ ] Set up Tailwind in client
- [ ] Create `.env.example` with `OPENAI_API_KEY=your_key_here`
- [ ] Add `.gitignore` (node_modules, .env, dist)
- [ ] Create `/data/` folder with all 4 synthetic JSON files
- [ ] **Set up Vitest** in `/server` with a test script in package.json
- [ ] **Write a smoke test** that imports each JSON data file and verifies it has the expected structure (array, required keys). This validates your synthetic data before any code depends on it.
- [ ] ✅ Checkpoint: `npm test` passes, both client and server start with `npm run dev`

---

### Phase 2: Fallback Services — TDD (2 hrs)

Build the rule-based fallback first. It's simpler, needs no API key, and gives you something testable immediately.

**2a. Skill Extraction Fallback**
- [ ] 🔴 Write test: `fallbackService.extractSkills(resumeText)` returns known skills from taxonomy
- [ ] 🔴 Write test: `fallbackService.extractSkills("")` returns empty array (edge case)
- [ ] 🔴 Write test: extractSkills handles aliases (e.g., "ReactJS" → "React")
- [ ] 🟢 Implement `fallbackService.extractSkills()` — tokenize text, match against skills_taxonomy.json
- [ ] ✅ Checkpoint: all 3 tests pass

**2b. Gap Analysis Fallback**
- [ ] 🔴 Write test: `fallbackService.analyzeGap(skills, targetRole)` returns matched, missing, and percentage
- [ ] 🔴 Write test: returns 0% match when no skills overlap
- [ ] 🔴 Write test: returns 100% match when all skills present
- [ ] 🟢 Implement `fallbackService.analyzeGap()` — compare against job_descriptions.json
- [ ] ✅ Checkpoint: all tests pass

**2c. Roadmap Fallback**
- [ ] 🔴 Write test: `fallbackService.generateRoadmap(missingSkills)` returns courses from courses.json
- [ ] 🔴 Write test: returns empty roadmap when missingSkills is empty
- [ ] 🟢 Implement `fallbackService.generateRoadmap()` — look up courses.json, sort by priority
- [ ] ✅ Checkpoint: all tests pass

---

### Phase 3: API Routes — TDD (1.5 hrs)

Now wrap the tested fallback services in Express routes.

**3a. GET /api/jobs**
- [ ] 🔴 Write test: GET /api/jobs returns all jobs
- [ ] 🔴 Write test: GET /api/jobs?category=Cloud filters correctly
- [ ] 🔴 Write test: GET /api/jobs?search=terraform filters by keyword
- [ ] 🟢 Implement the route
- [ ] ✅ Checkpoint: all tests pass

**3b. POST /api/analyze-resume**
- [ ] 🔴 Write test: valid request returns expected response shape (`extractedSkills`, `matchedSkills`, `missingSkills`, `matchPercentage`, `mode`)
- [ ] 🔴 Write test: empty resumeText returns 400 with validation error
- [ ] 🔴 Write test: missing targetRole returns 400 with validation error
- [ ] 🟢 Implement route + input validation middleware
- [ ] ✅ Checkpoint: all tests pass

**3c. POST /api/generate-roadmap**
- [ ] 🔴 Write test: valid request returns roadmap array with correct shape
- [ ] 🔴 Write test: empty missingSkills array returns empty roadmap (not an error)
- [ ] 🟢 Implement route
- [ ] ✅ Checkpoint: all tests pass

**3d. Rate Limiting + Input Sanitization**
- [ ] Install `express-rate-limit` — apply globally to all `/api/` routes
- [ ] Configure: 50 requests per minute per IP (generous for local dev, shows intent)
- [ ] Apply a stricter limit to AI-powered routes: 10 requests per minute for POST /api/analyze-resume and POST /api/generate-roadmap (these hit OpenAI and cost money)
- [ ] Add input sanitization middleware: trim whitespace, cap `resumeText` at 10,000 characters, reject if over limit with 413 status
- [ ] 🔴 Write test: POST /api/analyze-resume with resumeText over 10,000 chars → returns 413
- [ ] 🟢 Implement the sanitization check
- [ ] ✅ Checkpoint: all tests pass, **run full test suite to confirm nothing broke**

---

### Phase 4: AI Integration — TDD (1.5 hrs)

Layer AI on top of the working fallback. The key design: try AI first, catch errors, fall back automatically.

**4a. AI Service Module**
- [ ] 🔴 Write test: `aiService.extractSkills(resumeText)` returns an array of strings (mock the OpenAI call)
- [ ] 🔴 Write test: when OpenAI call throws, the function throws (so the route can catch and fallback)
- [ ] 🟢 Implement `aiService.extractSkills()` with OpenAI API call
- [ ] ✅ Checkpoint: tests pass with mocked API

**4b. AI Gap Analysis + Roadmap**
- [ ] 🔴 Write test: `aiService.analyzeGap()` returns correct shape (mocked)
- [ ] 🔴 Write test: `aiService.generateRoadmap()` returns correct shape (mocked)
- [ ] 🟢 Implement both functions
- [ ] ✅ Checkpoint: tests pass

**4c. Automatic Fallback Integration**
- [ ] 🔴 Write test: POST /api/analyze-resume with AI mocked to fail → returns valid response with `mode: "fallback"`
- [ ] 🔴 Write test: POST /api/analyze-resume with AI mocked to succeed → returns response with `mode: "ai"`
- [ ] 🟢 Update route handlers with try/catch: try AI → catch → use fallback → set mode field
- [ ] ✅ Checkpoint: **run full test suite — this is the critical integration moment**

---

### Phase 5: Frontend — Core Flow (2 hrs)

Frontend tests are lower priority for this submission. Focus on building working UI that connects to the tested backend.

**5a. Resume Input Page**
- [ ] Build text area component with character count
- [ ] Add sample resume loader dropdown (pulls from sample_resumes.json)
- [ ] Add target role selector (pulls categories from job data)
- [ ] Add input validation (disable submit if empty)
- [ ] Add AI/Fallback toggle switch

**5b. Gap Analysis Dashboard**
- [ ] Display matched vs. missing skills
- [ ] Show match percentage with visual indicator
- [ ] Add skill comparison chart (bar chart via Recharts or similar)
- [ ] Show which mode was used (AI or Fallback badge)

**5c. Roadmap View**
- [ ] Display ordered skill cards with priority ranking
- [ ] Each card shows: skill name, reason, estimated time, course links
- [ ] User can mark items as "completed" or "in progress" (local state)

**5d. Navigation + Polish**
- [ ] React Router: Home → Analysis → Roadmap flow
- [ ] Loading spinners during API calls
- [ ] Error states (API down, network error)
- [ ] Responsive layout check
- [ ] ✅ Checkpoint: end-to-end flow works manually in browser

---

### Phase 6: Documentation & Submission (1 hr)
- [ ] Complete README.md using the provided template
- [ ] Write DESIGN.md covering architecture, TDD approach, and trade-offs
- [ ] **Run full test suite one final time — all tests must pass**
- [ ] Record 5–7 min video: stack overview → demo → AI + fallback → run tests on camera → learnings
- [ ] Final review: .env.example present, no API keys committed, synthetic data included

---

## 10. File/Folder Structure

```
skill-bridge/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ResumeInput.jsx        # Resume text area + sample loader
│   │   │   ├── GapAnalysis.jsx        # Skill comparison dashboard
│   │   │   ├── Roadmap.jsx            # Learning path cards
│   │   │   ├── JobFilter.jsx          # Role category filter + search
│   │   │   └── SkillChart.jsx         # Visual chart component
│   │   ├── pages/
│   │   │   ├── HomePage.jsx           # Landing + resume input
│   │   │   ├── AnalysisPage.jsx       # Gap analysis results
│   │   │   └── RoadmapPage.jsx        # Learning roadmap
│   │   ├── services/
│   │   │   └── api.js                 # Axios/fetch wrapper for backend calls
│   │   ├── App.jsx                    # Router setup
│   │   └── main.jsx                   # Entry point
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── routes/
│   │   ├── jobs.js                    # GET /api/jobs
│   │   ├── jobs.test.js               # ← Tests live next to source
│   │   ├── analyze.js                 # POST /api/analyze-resume
│   │   ├── analyze.test.js            # ← Tests live next to source
│   │   ├── roadmap.js                 # POST /api/generate-roadmap
│   │   └── roadmap.test.js            # ← Tests live next to source
│   ├── services/
│   │   ├── aiService.js               # OpenAI API wrapper
│   │   ├── aiService.test.js          # ← Tests live next to source
│   │   ├── fallbackService.js         # Keyword matching logic
│   │   └── fallbackService.test.js    # ← Tests live next to source
│   ├── middleware/
│   │   ├── validation.js              # Input validation + sanitization
│   │   └── rateLimiter.js             # express-rate-limit config
│   ├── index.js                       # Express app entry
│   ├── vitest.config.js               # Test configuration
│   └── package.json
├── data/
│   ├── job_descriptions.json
│   ├── skills_taxonomy.json
│   ├── sample_resumes.json
│   └── courses.json
├── .env.example
├── .gitignore
├── README.md
├── DESIGN.md
└── package.json                       # Root scripts (e.g., "dev" runs both)
```

---

## 11. Testing Strategy (TDD)

Tests are written BEFORE implementation code. They live alongside the code they test.

### Test Location Convention
```
server/
├── services/
│   ├── fallbackService.js
│   ├── fallbackService.test.js      # Tests next to source
│   ├── aiService.js
│   └── aiService.test.js
├── routes/
│   ├── jobs.js
│   ├── jobs.test.js
│   ├── analyze.js
│   ├── analyze.test.js
│   ├── roadmap.js
│   └── roadmap.test.js
```

### Full Test Inventory

Built incrementally across Phases 1–4. By the end of Phase 4, you should have ~15+ tests.

| Phase | Test                                           | Type        | RED written in | GREEN passed in |
|-------|------------------------------------------------|-------------|----------------|-----------------|
| 1     | Synthetic data files have valid structure      | Unit        | Phase 1        | Phase 1         |
| 2a    | extractSkills returns known skills             | Unit        | Phase 2a       | Phase 2a        |
| 2a    | extractSkills on empty string → empty array    | Unit/Edge   | Phase 2a       | Phase 2a        |
| 2a    | extractSkills resolves aliases                 | Unit        | Phase 2a       | Phase 2a        |
| 2b    | analyzeGap returns matched/missing/percentage  | Unit        | Phase 2b       | Phase 2b        |
| 2b    | analyzeGap with 0% overlap                     | Unit/Edge   | Phase 2b       | Phase 2b        |
| 2b    | analyzeGap with 100% overlap                   | Unit/Edge   | Phase 2b       | Phase 2b        |
| 2c    | generateRoadmap returns courses                | Unit        | Phase 2c       | Phase 2c        |
| 2c    | generateRoadmap with empty input               | Unit/Edge   | Phase 2c       | Phase 2c        |
| 3a    | GET /api/jobs returns all jobs                 | Integration | Phase 3a       | Phase 3a        |
| 3a    | GET /api/jobs?category= filters correctly      | Integration | Phase 3a       | Phase 3a        |
| 3b    | POST /api/analyze-resume valid request         | Integration | Phase 3b       | Phase 3b        |
| 3b    | POST /api/analyze-resume empty body → 400      | Integration | Phase 3b       | Phase 3b        |
| 3c    | POST /api/generate-roadmap valid request       | Integration | Phase 3c       | Phase 3c        |
| 3d    | POST /api/analyze-resume oversized input → 413 | Integration | Phase 3d       | Phase 3d        |
| 4a    | AI extractSkills returns array (mocked)        | Unit        | Phase 4a       | Phase 4a        |
| 4c    | AI failure triggers fallback with mode field   | Integration | Phase 4c       | Phase 4c        |
| 4c    | AI success returns mode: "ai"                  | Integration | Phase 4c       | Phase 4c        |

### Running Tests
```bash
# Run all tests
cd server && npm test

# Run specific test file
npx vitest run services/fallbackService.test.js

# Run in watch mode during development
npx vitest watch
```

---

## 12. Security Checklist

- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` exists with placeholder values
- [ ] No API keys in any committed file
- [ ] All data is synthetic (no real PII)
- [ ] Input is validated and sanitized server-side
- [ ] Rate limiting applied to all API routes (50 req/min general, 10 req/min on AI routes)
- [ ] Resume text input capped at 10,000 characters (returns 413 if exceeded)
- [ ] All user input is trimmed of leading/trailing whitespace before processing

**Why rate limiting matters here:** Even though this runs on localhost, it demonstrates to reviewers that you've thought about what happens if this were deployed. The AI routes hit a paid API — rate limiting prevents accidental cost spikes and is a core "Responsible AI" consideration.

---

## 13. README Template (Fill During Phase 6)

```markdown
# Skill-Bridge Career Navigator

## Overview
[1–2 sentences: what this tool does]

## Tech Stack
- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- AI: OpenAI API (GPT-4o-mini)
- Testing: Vitest

## Getting Started

### Prerequisites
- Node.js >= 18
- OpenAI API key

### Installation
1. Clone the repo
2. Copy `.env.example` to `.env` and add your API key
3. `npm install` in root, `/client`, and `/server`
4. `npm run dev` to start both servers

## Design Decisions
[Link to DESIGN.md or summarize key trade-offs]

## AI Integration
- **AI Mode:** [Describe what AI does]
- **Fallback Mode:** [Describe what happens without AI]
- **Toggle:** [How reviewers can switch between modes]

## Testing
- `npm test` to run all tests
- Test 1: [describe]
- Test 2: [describe]

## Future Enhancements
- [ ] Real job board API integration
- [ ] User accounts and progress tracking
- [ ] Mock interview question generation
- [ ] PDF resume upload with OCR

## Video Demo
[YouTube/Vimeo link — Public viewing]
```

---

## 14. Scoring Alignment

How this plan maps to the 5 evaluation pillars:

| Pillar                  | How We Address It                                                              |
|-------------------------|--------------------------------------------------------------------------------|
| 🎯 Problem Understanding | Clear target audience, focused MVP scope, "dream role" user story              |
| ⚙️ Technical Rigor       | TDD methodology, 15+ tests, clean architecture, separated AI/fallback services |
| 💡 Creativity            | Visual gap dashboard, prioritized roadmap, demo-friendly sample data           |
| 🔧 Prototype Quality     | End-to-end flow works, loading states, error handling, toggle for demo         |
| ⚖️ Responsible AI        | Explicit fallback, mode indicator, synthetic data only, no key leaks           |

---

## How to Use This Document with Claude Code

1. **Start a new Claude Code session**
2. **Paste this entire document** as your first message, prefixed with:
   > "This is my project plan. We are using Test-Driven Development. Please help me implement it phase by phase. Start with Phase 1: Project Scaffold + Test Infrastructure. For every feature: write the failing test FIRST, then implement the code to make it pass, then refactor. Never move to the next feature until all current tests pass. After each phase, run the full test suite and confirm everything is green before proceeding."
3. **Work through each phase sequentially** — don't skip ahead
4. **After each phase**, run `npm test` and verify all tests pass before saying "next phase"
5. **Refer back to specific sections** (e.g., "See Section 6 for the API design") when Claude Code needs context
6. **If a test fails**, fix it immediately — do not accumulate broken tests
