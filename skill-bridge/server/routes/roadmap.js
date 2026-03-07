import { Router } from 'express'
import { generateRoadmap } from '../services/fallbackService.js'

const router = Router()

router.post('/', (req, res) => {
  const { missingSkills } = req.body

  if (!Array.isArray(missingSkills)) {
    return res.status(400).json({ error: 'missingSkills must be an array' })
  }

  const roadmap = generateRoadmap(missingSkills)

  res.json({ roadmap, mode: 'fallback' })
})

export default router
