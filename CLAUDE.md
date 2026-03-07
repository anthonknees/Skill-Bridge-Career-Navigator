# Skill-Bridge Career Navigator

## Project Overview
Career navigation platform: user pastes resume → AI analyzes skill gaps against job descriptions → generates personalized learning roadmap. Rule-based fallback when AI is unavailable.

## Tech Stack (Locked — Do Not Change)
- Frontend: React (Vite) + Tailwind CSS
- Backend: Node.js + Express
- AI: OpenAI API (GPT-4o-mini)
- Testing: Vitest (unit + integration)
- Data: Synthetic JSON files in /data/ (no database)

## Development Methodology
Use Test-Driven Development (TDD) for ALL backend code:
1. RED — Write the failing test first
2. GREEN — Write minimum code to pass the test
3. REFACTOR — Clean up while keeping tests green
Never move to the next feature until current tests pass.
Run `npm test` after every change.

## Architecture Rules
- Tests live next to source files (e.g., fallbackService.test.js next to fallbackService.js)
- AI service and fallback service are separate modules in /server/services/
- Every API response that uses AI must include a `mode` field: "ai" or "fallback"
- AI failure must automatically trigger the fallback — never return an error to the user
- All API routes go through validation middleware
- Rate limiting: 50 req/min general, 10 req/min on AI routes (express-rate-limit)
- Resume input capped at 10,000 characters (return 413 if exceeded)

## API Endpoints
- GET /api/jobs — filter by ?category= and ?search=
- POST /api/analyze-resume — input: { resumeText, targetRole } → output: { extractedSkills, matchedSkills, missingSkills, matchPercentage, mode }
- POST /api/generate-roadmap — input: { missingSkills, timeframe } → output: { roadmap: [...], mode }

## Synthetic Data Files (in /data/)
- job_descriptions.json — 15-25 job descriptions across 4-5 categories
- skills_taxonomy.json — skill names, aliases, categories, related skills
- sample_resumes.json — pre-built demo profiles for reviewers
- courses.json — learning resources mapped to skills

## Security
- No API keys in committed files. Use .env + .env.example
- All data is synthetic. No real PII.
- Input validation and sanitization on all routes

## Reference
Full project plan with data schemas, AI prompts, phased build order, and test inventory:
See @docs/PROJECT_PLAN.md