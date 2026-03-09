# Skill-Bridge Career Navigator

## Candidate Information
- **Candidate Name:** Anthony Tran
- **Scenario Chosen:** Skill-Bridge Career Navigator
- **Estimated Time Spent:** 6 Hours measured with 45 minute blocks of pomodoro flows

## Video Demo
[Watch the demo](https://youtu.be/oJcQA9GNwSE?si=pvYLCia8VBaSjFOp)

## Quick Start

### Prerequisites
- Node.js >= 18
- OpenAI API key (get one at https://platform.openai.com)

### Run Commands
```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/skill-bridge-career-navigator.git
cd skill-bridge-career-navigator

# Install dependencies
npm install
cd client && npm install
cd ../server && npm install
cd ..

# Set up environment
cp server/.env.example server/.env
# Open server/.env and add your OpenAI API key

# Start the app (from project root)
npm run dev
```

The app runs on `http://localhost:5173` (frontend) and `http://localhost:3000` (backend).

No API key? No problem — the app runs in fallback mode automatically using rule-based keyword matching.

### Test Commands
```bash
cd server
npm test
```

## AI Disclosure

**Did you use an AI assistant?** Yes — Claude (Anthropic) via Claude Code and Claude.ai.

**How did you verify the suggestions?**
I used test-driven development throughout the project. Every backend feature started with a failing test before implementation, so AI-generated code had to pass concrete test assertions to be accepted. I also manually tested each API endpoint with curl and verified the frontend flow in the browser after each phase. AI-generated code was reviewed for correctness before committing — I did not blindly accept outputs.

**Give one example of a suggestion you rejected or changed:**
The AI initially structured the roadmap generation to make a separate OpenAI call for each missing skill individually. I rejected this because it would have multiplied API costs and latency by the number of missing skills (potentially 8–10 calls per analysis). Instead, I consolidated it into a single prompt that processes all missing skills at once and returns a complete roadmap in one API call.

## Features

### Core Features
- **Resume Analysis:** Paste resume text or load a sample profile, and the AI extracts your technical skills
- **Gap Analysis Dashboard:** Compare your skills against target role requirements with match percentage, matched skills, transferable skills, and missing skills sorted by job market demand
- **Learning Roadmap:** Prioritized skill cards with course recommendations, certification suggestions, and importance levels (high/medium/low) based on job posting frequency
- **AI + Fallback:** Every AI feature has a rule-based fallback that activates automatically if the API is unavailable — toggle between modes in the UI

### Additional Features
- **Custom Job Listing Import:** Paste any job posting and the AI extracts required skills for comparison
- **Transferable Skills Detection:** Career switchers see which existing skills are valuable in their target field
- **Skill Frequency Analysis:** See how often each missing skill appears across job postings for data-backed prioritization
- **Certification Recommendations:** Real industry certifications (AWS, Docker, Kubernetes, Terraform, etc.) with issuer, level, and prep time
- **Mentor Export:** Generate a shareable career development summary for mentoring sessions

## Tech Stack
- **Frontend:** React (Vite), Tailwind CSS
- **Backend:** Node.js, Express
- **AI:** OpenAI API (GPT-4o-mini)
- **Testing:** Vitest (TDD methodology)
- **Data:** Synthetic JSON files (no database)

## AI Integration
- **AI Mode:** OpenAI handles skill extraction, gap analysis, roadmap generation, job listing parsing, and export summaries
- **Fallback Mode:** Keyword matching against a skills taxonomy, set comparison for gap analysis, static course lookup for roadmaps
- **Toggle:** Use the switch in the UI to manually switch between AI and fallback modes

## Design Documentation
See [DOCUMENTATION.md](./DOCUMENTATION.md) for full architecture details, design decisions, and trade-offs.

## Tradeoffs & Prioritization

**What did you cut to stay within the time limit?**
- No user accounts or authentication — sessions are not persisted
- No resume file upload (PDF/DOCX) — text paste only for the MVP
- No real job board API integration — all job data is synthetic
- No end-to-end frontend tests — testing focused on backend services and API routes where the core logic lives

**What would you build next if you had more time?**
- Real job board integration (LinkedIn, Indeed APIs) to replace synthetic data
- User accounts with progress tracking so users can mark skills as learned over time
- Resume file upload with PDF and DOCX text extraction
- Mock interview question generation based on the user's specific skill gaps
- A collaborative mentor dashboard to track multiple mentees in one view

**Known limitations:**
- Gap analysis quality depends on the synthetic job descriptions dataset (15–25 postings) — a production version would need thousands of real postings for meaningful frequency data
- AI responses can vary between calls — the same resume may produce slightly different skill extractions on consecutive runs
- Certification data is static in courses.json and does not auto-update
- No persistence — refreshing the page loses the current analysis
- Rate limiting is configured for local development; production deployment would need stricter limits and authentication

