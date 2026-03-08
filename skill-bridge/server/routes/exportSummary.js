import { Router } from 'express'
import * as aiService from '../services/aiService.js'
import * as fallback from '../services/fallbackService.js'

const router = Router()

function buildFallbackSummary(analysisData) {
  const {
    targetRole = '',
    matchPercentage = 0,
    matchedSkills = [],
    missingSkills = [],
    transferableSkills = [],
  } = analysisData

  const jobTitle = fallback.getJobTitle(targetRole)

  const transferableList =
    transferableSkills.length > 0
      ? transferableSkills.map(s => (typeof s === 'string' ? s : s.skill)).join(', ')
      : 'None identified'

  const topMissing = missingSkills.slice(0, 3)
  const missingLines =
    topMissing.length > 0
      ? topMissing
          .map((s, i) => {
            const skillName = typeof s === 'string' ? s : s.skill
            const freq = typeof s === 'string' ? null : s.frequency
            const freqStr = freq != null ? ` — appears in ${freq}% of job postings` : ''
            return `${i + 1}. ${skillName}${freqStr}`
          })
          .join('\n')
      : '1. None — great match!'

  const firstStep =
    topMissing.length > 0
      ? (typeof topMissing[0] === 'string' ? topMissing[0] : topMissing[0].skill)
      : 'maintain your current skills'

  return [
    'Skills Assessment Summary',
    `Role: ${jobTitle}`,
    `Match: ${matchPercentage}%`,
    `Matched Skills: ${matchedSkills.length > 0 ? matchedSkills.join(', ') : 'None'}`,
    `Transferable Skills: ${transferableList}`,
    'Top Missing Skills (by demand):',
    missingLines,
    `Recommended first step: Focus on ${firstStep}.`,
  ].join('\n')
}

router.post('/', async (req, res) => {
  const analysisData = req.body

  if (req.query.forceMode !== 'fallback') {
    try {
      const summary = await aiService.generateSummary(analysisData)
      return res.json({ summary, mode: 'ai' })
    } catch (err) {
      console.error('[export-summary] AI failed, using fallback:', err.message)
    }
  }

  const summary = buildFallbackSummary(analysisData)
  return res.json({ summary, mode: 'fallback' })
})

export default router
