import { Router } from 'express'
import * as aiService from '../services/aiService.js'
import * as fallback from '../services/fallbackService.js'

const router = Router()

router.post('/', async (req, res) => {
  const { resumeText, targetRole } = req.body

  if (!resumeText || resumeText.trim() === '') {
    return res.status(400).json({ error: 'resumeText is required and cannot be empty' })
  }

  if (!targetRole || targetRole.trim() === '') {
    return res.status(400).json({ error: 'targetRole is required' })
  }

  if (req.query.forceMode !== 'fallback') {
    try {
      const extractedSkills = await aiService.extractSkills(resumeText)
      const { targetSkills, matched, missing, matchPercentage } = await aiService.analyzeGap(extractedSkills, targetRole)
      return res.json({
        extractedSkills,
        targetSkills,
        matchedSkills: matched,
        missingSkills: missing,
        matchPercentage,
        mode: 'ai',
      })
    } catch {
      // fall through to fallback
    }
  }

  const extractedSkills = fallback.extractSkills(resumeText)
  const { targetSkills, matchedSkills, missingSkills, matchPercentage } = fallback.analyzeGap(extractedSkills, targetRole)
  return res.json({ extractedSkills, targetSkills, matchedSkills, missingSkills, matchPercentage, mode: 'fallback' })
})

export default router
