import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { Router } from 'express'

const __dirname = dirname(fileURLToPath(import.meta.url))
const samples = JSON.parse(readFileSync(join(__dirname, '..', '..', 'data', 'sample_resumes.json'), 'utf-8'))

const router = Router()

router.get('/', (req, res) => res.json(samples))

export default router
