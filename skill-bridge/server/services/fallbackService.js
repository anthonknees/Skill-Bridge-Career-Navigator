import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', '..', 'data')

function loadJson(filename) {
  return JSON.parse(readFileSync(join(dataDir, filename), 'utf-8'))
}

const taxonomy = loadJson('skills_taxonomy.json')

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
