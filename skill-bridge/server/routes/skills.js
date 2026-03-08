import { Router } from 'express'
import * as fallback from '../services/fallbackService.js'

const router = Router()

router.get('/frequency', (req, res) => {
  const { category } = req.query
  if (!category || category.trim() === '') {
    return res.status(400).json({ error: 'category query parameter is required' })
  }

  const result = fallback.getSkillFrequency(category.trim())
  return res.json(result)
})

export default router
