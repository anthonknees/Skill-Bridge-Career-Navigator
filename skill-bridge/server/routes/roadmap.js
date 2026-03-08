import { Router } from 'express'
import * as aiService from '../services/aiService.js'
import * as fallback from '../services/fallbackService.js'

const router = Router()

router.post('/', async (req, res) => {
  const { missingSkills, timeframe, frequencyData } = req.body

  if (!Array.isArray(missingSkills)) {
    return res.status(400).json({ error: 'missingSkills must be an array' })
  }

  if (req.query.forceMode !== 'fallback') {
    try {
      const roadmap = await aiService.generateRoadmap(missingSkills, timeframe, frequencyData)
      return res.json({ roadmap, mode: 'ai' })
    } catch (err) {
      console.error('[roadmap] AI failed, using fallback:', err.message)
    }
  }

  const roadmap = fallback.generateRoadmap(missingSkills, frequencyData)
  return res.json({ roadmap, mode: 'fallback' })
})

export default router
