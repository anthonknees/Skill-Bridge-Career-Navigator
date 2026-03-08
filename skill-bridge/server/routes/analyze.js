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

function nullFrequency(missingSkills) {
  return missingSkills.map(item => ({
    ...(typeof item === 'string' ? {} : item),
    skill: typeof item === 'string' ? item : item.skill,
    frequency: null,
    totalJobs: null,
  }))
}

router.post('/', async (req, res) => {
  const { resumeText, targetRole, customJobSkills } = req.body

  if (!resumeText || resumeText.trim() === '') {
    return res.status(400).json({ error: 'resumeText is required and cannot be empty' })
  }

  const hasTargetRole = targetRole && targetRole.trim() !== ''
  const hasCustomSkills = Array.isArray(customJobSkills) && customJobSkills.length > 0

  if (!hasTargetRole && !hasCustomSkills) {
    return res.status(400).json({ error: 'Either targetRole or customJobSkills must be provided' })
  }

  if (req.query.forceMode !== 'fallback') {
    try {
      const extractedSkills = await aiService.extractSkills(resumeText)
      const { targetSkills, matched, missing, transferable, matchPercentage } = await aiService.analyzeGap(
        extractedSkills,
        hasTargetRole ? targetRole : null,
        hasCustomSkills ? customJobSkills : null,
      )
      const jobCategory = hasTargetRole ? fallback.getJobCategory(targetRole) : null
      const missingSkills = jobCategory ? enrichMissing(missing, jobCategory) : nullFrequency(missing)
      return res.json({
        extractedSkills,
        targetSkills,
        matchedSkills: matched,
        missingSkills,
        transferableSkills: transferable ?? [],
        matchPercentage,
        mode: 'ai',
      })
    } catch (err) {
      console.error('[analyze] AI failed, using fallback:', err.message)
    }
  }

  const extractedSkills = fallback.extractSkills(resumeText)
  const { targetSkills, matchedSkills, missingSkills, matchPercentage, jobCategory } = fallback.analyzeGap(
    extractedSkills,
    hasTargetRole ? targetRole : null,
    hasCustomSkills ? customJobSkills : null,
  )
  const { transferable: transferableSkills } = fallback.identifyTransferableSkills(extractedSkills, jobCategory)
  const enrichedMissing = jobCategory ? enrichMissing(missingSkills, jobCategory) : nullFrequency(missingSkills)
  return res.json({ extractedSkills, targetSkills, matchedSkills, missingSkills: enrichedMissing, matchPercentage, transferableSkills, mode: 'fallback' })
})

export default router
