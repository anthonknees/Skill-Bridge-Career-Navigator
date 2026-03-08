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

  return { targetSkills, matchedSkills, missingSkills, matchPercentage, jobCategory: job.category }
}

export function identifyTransferableSkills(userSkills, targetRoleCategory) {
  const transferable = []
  const notRelevant = []

  for (const skill of userSkills) {
    const entry = taxonomy[skill]
    if (!entry) continue

    // Skills in the same category are handled by analyzeGap (matched/missing)
    if (entry.category === targetRoleCategory) continue

    if (entry.transferable_to && entry.transferable_to.includes(targetRoleCategory)) {
      transferable.push(skill)
    } else {
      notRelevant.push(skill)
    }
  }

  return { transferable, notRelevant }
}

export function getJobTitle(jobId) {
  const job = jobs.find(j => j.id === jobId)
  return job ? job.title : jobId
}

export function getJobCategory(jobId) {
  const job = jobs.find(j => j.id === jobId)
  return job ? job.category : null
}

export function getSkillFrequency(category) {
  const categoryJobs = jobs.filter(j => j.category === category)
  if (categoryJobs.length === 0) return []

  const counts = new Map()
  for (const job of categoryJobs) {
    for (const skill of job.required_skills) {
      counts.set(skill, (counts.get(skill) || 0) + 1)
    }
  }

  const total = categoryJobs.length
  return [...counts.entries()]
    .map(([skill, count]) => ({
      skill,
      count,
      total,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
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
