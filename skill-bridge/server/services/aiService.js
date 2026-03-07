import OpenAI from 'openai'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const jobs = JSON.parse(readFileSync(join(__dirname, '..', '..', 'data', 'job_descriptions.json'), 'utf-8'))

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

async function callAI(prompt) {
  const client = getClient()
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  })
  return response.choices[0].message.content
}

export async function extractSkills(resumeText) {
  const content = await callAI(`You are a resume analysis assistant. Extract technical skills from the following resume text.

Return ONLY a JSON array of skill names. Be specific (e.g., "React" not "frontend frameworks").
Include programming languages, tools, platforms, frameworks, and methodologies.

Resume:
---
${resumeText}
---

Output format: ["skill1", "skill2", ...]`)

  const parsed = JSON.parse(content)

  // Handle both ["skill1", ...] and {"skills": [...]} shaped responses
  if (Array.isArray(parsed)) return parsed
  const key = Object.keys(parsed).find(k => Array.isArray(parsed[k]))
  if (key) return parsed[key]
  return []
}

export async function analyzeGap(extractedSkills, jobId) {
  const job = jobs.find(j => j.id === jobId)
  if (!job) throw new Error(`Job not found: ${jobId}`)

  const content = await callAI(`You are a career advisor AI. Compare the candidate's skills against the target role requirements.

Candidate skills: ${JSON.stringify(extractedSkills)}
Target role: ${job.title}
Required skills for this role: ${JSON.stringify(job.required_skills)}

For each missing skill, briefly explain why it matters for this role (1 sentence).

Return JSON:
{
  "matched": [...],
  "missing": [{ "skill": "AWS", "importance": "high|medium|low", "reason": "..." }],
  "matchPercentage": number
}`)

  const parsed = JSON.parse(content)
  return { ...parsed, targetSkills: job.required_skills }
}

export async function generateRoadmap(missingSkills, timeframe) {
  const content = await callAI(`You are a learning path advisor. Create a prioritized study roadmap for these missing skills.
The user wants to be job-ready within ${timeframe}.

Missing skills: ${JSON.stringify(missingSkills)}

For each skill, suggest 1-2 specific learning resources (real or plausible course names).
Order by priority (foundational skills first, specialized skills later).

Return JSON array:
[{ "skill": "...", "priority": 1, "reason": "...", "estimatedWeeks": 2,
   "courses": [{ "title": "...", "provider": "...", "hours": 10, "free": true }] }]`)

  const parsed = JSON.parse(content)
  if (Array.isArray(parsed)) return parsed
  const key = Object.keys(parsed).find(k => Array.isArray(parsed[k]))
  if (key) return parsed[key]
  return []
}
