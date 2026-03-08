# Skill-Bridge Career Navigator — Design Documentation

## 1. Problem Statement

Students, recent graduates, and career switchers face a persistent "skills gap" between their current abilities and the specific technical requirements of job postings. Navigating multiple job boards and certification sites makes it difficult to see a clear, personalized path from where they are to where they want to be. Mentors guiding these individuals lack data-driven tools to provide concrete, evidence-based recommendations.

Skill-Bridge Career Navigator addresses this by providing a single platform where users can paste their resume, select a target role (or paste a real job listing), and receive an AI-powered gap analysis with a prioritized learning roadmap — complete with course and certification recommendations.

## 2. Target Audiences

The platform is designed for three distinct user groups, and each is supported by specific features:

**Recent Graduates** are the primary users. They paste their resume, pick a target role like "Cloud Engineer," and immediately see which skills they have, which they're missing, and what to learn first. The gap analysis dashboard and learning roadmap are built around this core workflow.

**Career Switchers** need more than a list of missing skills — they need to understand what transfers from their current field. The transferable skills feature identifies which of their existing skills are valuable in a new industry and explains how they apply. This reframes the career change from "starting over" to "building on what you have."

**Mentors** need data-backed evidence to guide conversations. The skill frequency analysis shows how often each skill appears across job postings, giving mentors concrete numbers to prioritize recommendations. The export summary feature generates a shareable text summary that can be used in mentoring sessions, emails, or progress tracking.

## 3. Technical Stack

| Component       | Technology          | Rationale                                                              |
|-----------------|---------------------|------------------------------------------------------------------------|
| Frontend        | React (Vite)        | Fast development server, hot module replacement, widely adopted        |
| Styling         | Tailwind CSS        | Utility-first approach enables rapid prototyping without custom CSS    |
| Backend         | Node.js + Express   | Same language as frontend reduces context switching, simple REST setup  |
| AI Provider     | OpenAI (GPT-4o-mini)| Cost-effective for structured JSON output, well-documented API         |
| Testing         | Vitest              | Fast, Vite-native test runner, compatible with the existing toolchain  |
| Data Storage    | JSON files          | No database complexity for an MVP — synthetic data ships with the repo |

**Why no database?** The challenge requires synthetic data and doesn't require persistence across sessions. JSON files in the `/data/` directory are version-controlled, easy to inspect, and eliminate setup complexity for reviewers. If this were a production application, the data layer would migrate to PostgreSQL or MongoDB.

**Why GPT-4o-mini over GPT-4o?** Cost. This project makes multiple AI calls per user session (skill extraction, gap analysis, roadmap generation, job listing parsing, export summary). GPT-4o-mini handles structured JSON output reliably at a fraction of the cost, which matters both for development iteration and for demonstrating awareness of production cost constraints.

## 4. Architecture

The application follows a standard client-server architecture with a clear separation between AI and fallback processing paths.

```
User Input (Resume + Target Role or Job Listing)
        │
        ▼
┌─────────────────────────────────┐
│         React Frontend          │
│  Resume Input → Dashboard →    │
│  Roadmap → Export              │
└───────────────┬─────────────────┘
                │ REST API
┌───────────────▼─────────────────┐
│         Express Backend         │
│                                 │
│  ┌───────────┐  ┌────────────┐  │
│  │ AI Service│  │  Fallback  │  │
│  │ (OpenAI)  │  │  Service   │  │
│  └─────┬─────┘  └──────┬─────┘  │
│        │    try/catch   │        │
│        └───────┬────────┘        │
│                ▼                 │
│  Response with mode: "ai"|      │
│              "fallback"         │
└───────────────┬─────────────────┘
                │
    ┌───────────▼───────────┐
    │   Synthetic Data      │
    │   (JSON files)        │
    └───────────────────────┘
```

Every API response includes a `mode` field indicating whether AI or the fallback service processed the request. The frontend displays this as a badge so users (and reviewers) always know which path was used.

## 5. AI Integration

AI is used in five places, each with a specific purpose:

**Skill Extraction** parses unstructured resume text and identifies technical skills. The AI understands context — "managed cloud infrastructure on AWS" implies AWS, cloud architecture, and infrastructure-as-code skills, even if those exact terms aren't present. The fallback tokenizes text and matches against a skills taxonomy dictionary.

**Gap Analysis** compares extracted skills against target role requirements and provides reasoning about why each missing skill matters. The fallback performs a simple set comparison and percentage calculation.

**Roadmap Generation** creates a prioritized learning path with course recommendations, ordered so foundational skills come before specialized ones. The fallback looks up courses from a static data file and sorts by a hardcoded priority map.

**Job Listing Parsing** extracts required skills, job title, and role category from unstructured job posting text. This enables users to paste any real job listing for comparison. The fallback runs the same keyword matching used in skill extraction.

**Export Summary** generates a natural-language career development summary for mentoring sessions. The fallback produces a structured template with the same data points.

### Prompt Engineering Approach

All AI prompts enforce strict JSON-only output. Early development revealed that the AI sometimes returned conversational text (e.g., "Here's a plan for you...") before the JSON, which broke parsing. The fix was twofold: prompts now end with "Return ONLY valid JSON. No explanation, no markdown, no text before or after the JSON," and the response handler strips markdown code fences before parsing.

### Fallback Design Philosophy

The fallback is not a degraded experience — it's a functional alternative. A user who runs the app without an API key should still receive useful, actionable results. The fallback services were built first (Phases 2a–2c) and fully tested before any AI code was written. This means the app's core value proposition works with zero external dependencies.

## 6. Key Features and Design Decisions

### Gap Analysis Dashboard

**Decision:** Display three skill categories — matched, transferable, and missing — rather than just matched and missing.

**Rationale:** Showing only matched and missing skills creates a discouraging experience for career switchers. A marketing professional targeting a Cloud Engineer role would see a 10% match and a wall of missing skills. Adding the transferable category acknowledges that their communication, project management, and data analysis skills are valuable in the new field, even if they aren't listed as "required."

### Skill Frequency Analysis

**Decision:** Derive skill importance from frequency across job descriptions rather than using a static importance ranking.

**Rationale:** Importance is relative to the job market, not absolute. A skill that appears in 90% of Cloud Engineer postings is more urgent to learn than one that appears in 20%, regardless of how "advanced" it is. Using frequency data from the synthetic job descriptions makes this data-driven rather than opinion-based. This directly supports the mentor use case — mentors can point to specific numbers rather than relying on personal judgment.

### Custom Job Listing Import

**Decision:** Allow users to paste raw job posting text rather than only matching against pre-built role categories.

**Rationale:** The synthetic job descriptions cover common roles but can't anticipate every posting a user encounters. Letting users paste a real job listing makes the tool immediately practical. The AI parses the unstructured text to extract skills, and the app then runs the same gap analysis against those extracted skills. When using custom job listings, frequency data is unavailable (the skills don't come from the dataset), so the UI gracefully hides frequency-dependent features.

### Certification Recommendations

**Decision:** Use real certification names and issuing organizations rather than synthetic ones.

**Rationale:** Unlike job descriptions (which must be synthetic to avoid copyright issues), certifications are publicly listed professional programs. Using real names (AWS Certified Cloud Practitioner, CKA, HashiCorp Terraform Associate) makes recommendations actionable — users can search for and pursue these certifications immediately. Certifications are only shown for skills where well-known credentials exist; skills without recognized certifications simply don't show the certifications section.

### AI/Fallback Toggle

**Decision:** Expose a manual toggle in the UI rather than only using automatic failover.

**Rationale:** The automatic try/catch failover ensures the app always works. The manual toggle exists for transparency and review purposes — it lets anyone verify that both paths produce reasonable results. In a production application, this toggle would likely be hidden behind a developer settings panel.

## 7. Testing Strategy

The project follows Test-Driven Development (TDD). Every backend feature was built by writing failing tests first, then implementing the minimum code to pass them.

Tests are co-located with source files (e.g., `fallbackService.test.js` next to `fallbackService.js`) rather than in a separate test directory. This makes it immediately obvious which code is covered and keeps related files together.

The test suite covers:

- **Unit tests** for fallback service methods (skill extraction, gap analysis, roadmap generation, transferable skills, frequency analysis)
- **Edge case tests** for empty inputs, zero-overlap scenarios, full-overlap scenarios, oversized inputs, and missing fields
- **Integration tests** for all API endpoints (valid requests, validation errors, AI-to-fallback switching)
- **AI service tests** using mocked OpenAI calls to verify response shape handling without requiring a live API key

All AI service tests mock the OpenAI API. This ensures the test suite runs without an API key and doesn't incur costs on every test run.

## 8. Security Considerations

**API Key Management:** The OpenAI API key is stored in a `.env` file that is excluded from version control via `.gitignore`. A `.env.example` file with placeholder values is committed to show reviewers what configuration is needed.

**Rate Limiting:** Express-rate-limit is applied at two tiers — 50 requests per minute globally and 10 requests per minute on AI-powered endpoints. The stricter limit on AI routes prevents accidental cost spikes from the OpenAI API.

**Input Sanitization:** All user input is trimmed of whitespace. Resume text is capped at 10,000 characters and job listing text at 15,000 characters, returning 413 status codes if exceeded. All routes validate required fields and return 400 with descriptive error messages for invalid input.

**Synthetic Data Only:** No real personal data, job postings, or user information is used anywhere in the application. All job descriptions, resumes, and skill data are synthetic and created specifically for this project.

## 9. Trade-offs and Limitations

**No persistence:** User sessions are not saved. If a user refreshes the page, their analysis is lost. This was an intentional scope decision — adding a database would increase setup complexity for reviewers without adding meaningful value to the core feature demonstration.

**Synthetic data quality:** The gap analysis is only as good as the synthetic job descriptions. With 15–25 job descriptions, the frequency analysis has a small sample size. In production, this would be powered by aggregated data from real job boards.

**AI output variability:** The same resume can produce slightly different results on consecutive AI calls. This is inherent to LLM-based processing. The fallback service always produces deterministic results, which is why it exists.

**No resume file upload:** The current version accepts pasted text only, not PDF or DOCX uploads. Adding file upload with text extraction (e.g., via pdf-parse or mammoth) would be a straightforward enhancement.

**Certification data is static:** Certifications are stored in the courses.json data file and don't update automatically. In production, this would ideally pull from certification provider APIs or be updated periodically.

## 10. Future Enhancements

If this project were continued beyond the submission, the following enhancements would add the most value:

- **Real job board integration** via APIs from LinkedIn, Indeed, or Greenhouse to replace synthetic data with live postings
- **User accounts and progress tracking** to let users mark skills as learned and track their match percentage over time
- **Resume file upload** supporting PDF and DOCX with text extraction
- **Mock interview generation** producing technical interview questions based on the user's specific skill gaps
- **Collaborative mentoring dashboard** where mentors can view multiple mentees' progress in one place
- **Skill relationship graph** visualizing how skills connect and which foundational skills unlock others
