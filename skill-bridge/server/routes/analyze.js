import { Router } from 'express'
import { extractSkills, analyzeGap } from '../services/fallbackService.js'

const router = Router()

router.post('/', (req, res) => {
  const { resumeText, targetRole } = req.body

  if (!resumeText || resumeText.trim() === '') {
    return res.status(400).json({ error: 'resumeText is required and cannot be empty' })
  }

  if (!targetRole || targetRole.trim() === '') {
    return res.status(400).json({ error: 'targetRole is required' })
  }

  const extractedSkills = extractSkills(resumeText)
  const { targetSkills, matchedSkills, missingSkills, matchPercentage } = analyzeGap(extractedSkills, targetRole)

  res.json({
    extractedSkills,
    targetSkills,
    matchedSkills,
    missingSkills,
    matchPercentage,
    mode: 'fallback',
  })
})

export default router
