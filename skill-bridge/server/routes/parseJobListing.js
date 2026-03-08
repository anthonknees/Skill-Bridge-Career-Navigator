import { Router } from 'express'
import * as aiService from '../services/aiService.js'
import * as fallback from '../services/fallbackService.js'

const router = Router()
const JOB_LISTING_MAX_CHARS = 15000

router.post('/', async (req, res) => {
  const { jobText } = req.body

  if (!jobText || jobText.trim() === '') {
    return res.status(400).json({ error: 'jobText is required and cannot be empty' })
  }

  if (jobText.length > JOB_LISTING_MAX_CHARS) {
    return res.status(413).json({ error: `jobText exceeds maximum length of ${JOB_LISTING_MAX_CHARS} characters` })
  }

  if (req.query.forceMode !== 'fallback') {
    try {
      const result = await aiService.parseJobListing(jobText)
      return res.json({ ...result, mode: 'ai' })
    } catch (err) {
      console.error('[parse-job-listing] AI failed, using fallback:', err.message)
    }
  }

  const result = fallback.parseJobListing(jobText)
  return res.json({ ...result, mode: 'fallback' })
})

export default router
