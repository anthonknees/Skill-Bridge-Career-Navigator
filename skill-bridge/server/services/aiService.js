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

// Extract and parse the first JSON array or object from the response.
// Handles markdown fences (```json...```) and any leading/trailing prose.
function parseJSON(content) {
  const fenceStripped = content.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()
  const start = Math.min(
    fenceStripped.indexOf('[') === -1 ? Infinity : fenceStripped.indexOf('['),
    fenceStripped.indexOf('{') === -1 ? Infinity : fenceStripped.indexOf('{'),
  )
  if (start === Infinity) throw new Error('No JSON found in AI response')
  return JSON.parse(fenceStripped.slice(start))
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

  const parsed = parseJSON(content)

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
Additionally, identify which of the candidate's existing skills are transferable to the target role's industry, even if they aren't listed as required skills. For each transferable skill, briefly explain how it applies to the new field.

Return JSON:
{
  "matched": [...],
  "missing": [{ "skill": "AWS", "importance": "high|medium|low", "reason": "..." }],
  "transferable": [{ "skill": "Communication", "relevance": "Essential for cross-team collaboration in cloud engineering" }],
  "matchPercentage": number
}`)

  const parsed = parseJSON(content)
  return { ...parsed, targetSkills: job.required_skills }
}

export async function generateSummary(analysisData) {
  const { matchPercentage = 0, matchedSkills = [], missingSkills = [], transferableSkills = [] } = analysisData
  const topMissing = missingSkills.slice(0, 3).map(s => (typeof s === 'string' ? s : s.skill))
  const topTransferable = transferableSkills.slice(0, 3).map(s => (typeof s === 'string' ? s : s.skill))

  return callAI(`Write a brief 3-4 paragraph career development summary for a mentoring session.
Include: current match percentage, top 3 transferable skills (if any), the 3 most critical missing skills ranked by job market frequency, and a recommended first step. Write in second person ('You have...', 'Your next step...'). Keep it under 200 words.

Analysis data:
- Match percentage: ${matchPercentage}%
- Matched skills: ${matchedSkills.join(', ') || 'None'}
- Top transferable skills: ${topTransferable.join(', ') || 'None identified'}
- Top missing skills (by market demand): ${topMissing.join(', ') || 'None'}`)
}

export async function generateRoadmap(missingSkills, timeframe, frequencyData) {
  const freqSection = frequencyData && frequencyData.length > 0
    ? `\nFrequency data (how often each skill appears in job postings): ${JSON.stringify(frequencyData)}\nFor each skill, also assign an importance level: high, medium, or low based on how frequently it appears in job postings.`
    : ''

  const content = await callAI(`You are a learning path advisor. Create a prioritized study roadmap for these missing skills.
The user wants to be job-ready within ${timeframe}.

Missing skills: ${JSON.stringify(missingSkills)}${freqSection}

For each skill, suggest 1-2 specific learning resources (real or plausible course names).
Order by priority (foundational skills first, specialized skills later).

IMPORTANT: Respond with ONLY a raw JSON array. No explanation, no markdown, no prose before or after.

[{ "skill": "...", "priority": 1, "importance": "high|medium|low", "reason": "...", "estimatedWeeks": 2,
   "courses": [{ "title": "...", "provider": "...", "hours": 10, "free": true }] }]`)

  const parsed = parseJSON(content)
  if (Array.isArray(parsed)) return parsed
  const key = Object.keys(parsed).find(k => Array.isArray(parsed[k]))
  if (key) return parsed[key]
  return []
}
