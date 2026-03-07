import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { Router } from 'express'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', '..', 'data')
const jobs = JSON.parse(readFileSync(join(dataDir, 'job_descriptions.json'), 'utf-8'))

const router = Router()

router.get('/', (req, res) => {
  const { category, search } = req.query
  let result = jobs

  if (category) {
    result = result.filter(j => j.category.toLowerCase() === category.toLowerCase())
  }

  if (search) {
    const term = search.toLowerCase()
    result = result.filter(j => {
      const searchable = [
        j.title,
        j.description,
        ...(j.required_skills || []),
        ...(j.nice_to_have || []),
      ].join(' ').toLowerCase()
      return searchable.includes(term)
    })
  }

  res.json(result)
})

export default router
