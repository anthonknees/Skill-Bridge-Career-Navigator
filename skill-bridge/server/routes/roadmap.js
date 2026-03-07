import { Router } from 'express'
import * as aiService from '../services/aiService.js'
import * as fallback from '../services/fallbackService.js'

const router = Router()

router.post('/', async (req, res) => {
  const { missingSkills, timeframe } = req.body

  if (!Array.isArray(missingSkills)) {
    return res.status(400).json({ error: 'missingSkills must be an array' })
  }

  try {
    const roadmap = await aiService.generateRoadmap(missingSkills, timeframe)
    return res.json({ roadmap, mode: 'ai' })
  } catch {
    const roadmap = fallback.generateRoadmap(missingSkills)
    return res.json({ roadmap, mode: 'fallback' })
  }
})

export default router
