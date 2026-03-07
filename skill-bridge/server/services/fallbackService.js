import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', '..', 'data')

function loadJson(filename) {
  return JSON.parse(readFileSync(join(dataDir, filename), 'utf-8'))
}

const taxonomy = loadJson('skills_taxonomy.json')
const jobs = loadJson('job_descriptions.json')
const coursesData = loadJson('courses.json')

// Build alias → canonical name lookup map
const aliasMap = new Map()
for (const [canonicalName, data] of Object.entries(taxonomy)) {
  aliasMap.set(canonicalName.toLowerCase(), canonicalName)
  for (const alias of data.aliases) {
    aliasMap.set(alias.toLowerCase(), canonicalName)
  }
}

export function extractSkills(resumeText) {
  if (!resumeText || resumeText.trim() === '') return []

  const text = resumeText.toLowerCase()
  const found = new Set()

  // Match longest aliases first to avoid partial matches (e.g. "python3" before "python")
  const sortedAliases = [...aliasMap.keys()].sort((a, b) => b.length - a.length)

  for (const alias of sortedAliases) {
    // Use word-boundary-style matching: alias surrounded by non-alphanumeric chars (or string edges)
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i')
    if (regex.test(text)) {
      found.add(aliasMap.get(alias))
    }
  }

  return [...found]
}

export function analyzeGap(candidateSkills, jobId) {
  const job = jobs.find(j => j.id === jobId)
  if (!job) throw new Error(`Job not found: ${jobId}`)

  const targetSkills = job.required_skills
  const candidateSet = new Set(candidateSkills.map(s => s.toLowerCase()))

  const matchedSkills = targetSkills.filter(s => candidateSet.has(s.toLowerCase()))
  const missingSkills = targetSkills.filter(s => !candidateSet.has(s.toLowerCase()))
  const matchPercentage = Math.round((matchedSkills.length / targetSkills.length) * 100)

  return { targetSkills, matchedSkills, missingSkills, matchPercentage }
}

export function generateRoadmap(missingSkills) {
  if (!missingSkills || missingSkills.length === 0) return []

  const courseMap = new Map(coursesData.map(entry => [entry.skill, entry]))

  return missingSkills
    .map(skill => {
      const entry = courseMap.get(skill)
      return {
        skill,
        priority: entry ? entry.priority : 3,
        courses: entry ? entry.courses : [],
      }
    })
    .sort((a, b) => a.priority - b.priority)
}
