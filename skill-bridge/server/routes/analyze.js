import { Router } from 'express'
import * as aiService from '../services/aiService.js'
import * as fallback from '../services/fallbackService.js'

const router = Router()

function enrichMissing(missingSkills, jobCategory) {
  const freqData = fallback.getSkillFrequency(jobCategory)
  const freqMap = new Map(freqData.map(({ skill, percentage, total }) => [skill, { percentage, total }]))
  const totalJobs = freqData[0]?.total ?? 0

  return missingSkills
    .map(item => {
      const skillName = typeof item === 'string' ? item : item.skill
      const freq = freqMap.get(skillName) ?? { percentage: 0, total: totalJobs }
      return {
        ...(typeof item === 'string' ? {} : item),
        skill: skillName,
        frequency: freq.percentage,
        totalJobs: freq.total,
      }
    })
    .sort((a, b) => b.frequency - a.frequency)
}

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
      const { targetSkills, matched, missing, transferable, matchPercentage } = await aiService.analyzeGap(extractedSkills, targetRole)
      const jobCategory = fallback.getJobCategory(targetRole)
      return res.json({
        extractedSkills,
        targetSkills,
        matchedSkills: matched,
        missingSkills: enrichMissing(missing, jobCategory),
        transferableSkills: transferable ?? [],
        matchPercentage,
        mode: 'ai',
      })
    } catch (err) {
      console.error('[analyze] AI failed, using fallback:', err.message)
    }
  }

  const extractedSkills = fallback.extractSkills(resumeText)
  const { targetSkills, matchedSkills, missingSkills, matchPercentage, jobCategory } = fallback.analyzeGap(extractedSkills, targetRole)
  const { transferable: transferableSkills } = fallback.identifyTransferableSkills(extractedSkills, jobCategory)
  return res.json({ extractedSkills, targetSkills, matchedSkills, missingSkills: enrichMissing(missingSkills, jobCategory), matchPercentage, transferableSkills, mode: 'fallback' })
})

export default router
