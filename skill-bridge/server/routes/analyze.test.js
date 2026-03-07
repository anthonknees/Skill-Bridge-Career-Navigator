import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../index.js'
import * as aiService from '../services/aiService.js'

vi.mock('../services/aiService.js')

describe('POST /api/analyze-resume', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Default: AI throws so existing tests run through the fallback path
    aiService.extractSkills.mockRejectedValue(new Error('AI unavailable'))
  })

  it('returns expected response shape for a valid request', async () => {
    const res = await request(app)
      .post('/api/analyze-resume')
      .send({ resumeText: 'I have experience with Python, Docker, and Linux.', targetRole: 'jd-001' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('extractedSkills')
    expect(res.body).toHaveProperty('targetSkills')
    expect(res.body).toHaveProperty('matchedSkills')
    expect(res.body).toHaveProperty('missingSkills')
    expect(res.body).toHaveProperty('matchPercentage')
    expect(res.body).toHaveProperty('mode')
    expect(Array.isArray(res.body.extractedSkills)).toBe(true)
    expect(Array.isArray(res.body.matchedSkills)).toBe(true)
    expect(Array.isArray(res.body.missingSkills)).toBe(true)
    expect(typeof res.body.matchPercentage).toBe('number')
    expect(['ai', 'fallback']).toContain(res.body.mode)
  })

  it('returns 400 when resumeText is empty', async () => {
    const res = await request(app)
      .post('/api/analyze-resume')
      .send({ resumeText: '', targetRole: 'jd-001' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when targetRole is missing', async () => {
    const res = await request(app)
      .post('/api/analyze-resume')
      .send({ resumeText: 'I know Python and Docker.' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 413 when resumeText exceeds 10,000 characters', async () => {
    const res = await request(app)
      .post('/api/analyze-resume')
      .send({ resumeText: 'a'.repeat(10001), targetRole: 'jd-001' })

    expect(res.status).toBe(413)
    expect(res.body).toHaveProperty('error')
  })

  it('returns mode: "fallback" when AI fails', async () => {
    // aiService.extractSkills already mocked to throw via beforeEach
    const res = await request(app)
      .post('/api/analyze-resume')
      .send({ resumeText: 'I know Python and Docker.', targetRole: 'jd-001' })

    expect(res.status).toBe(200)
    expect(res.body.mode).toBe('fallback')
  })

  it('returns mode: "ai" when AI succeeds', async () => {
    aiService.extractSkills.mockResolvedValue(['Python'])
    aiService.analyzeGap.mockResolvedValue({
      matched: ['Python'],
      missing: [{ skill: 'AWS', importance: 'high', reason: 'Core cloud platform for this role.' }],
      matchPercentage: 25,
      targetSkills: ['AWS', 'Terraform', 'Docker', 'Python', 'Linux'],
    })

    const res = await request(app)
      .post('/api/analyze-resume')
      .send({ resumeText: 'I know Python.', targetRole: 'jd-001' })

    expect(res.status).toBe(200)
    expect(res.body.mode).toBe('ai')
    expect(Array.isArray(res.body.extractedSkills)).toBe(true)
    expect(Array.isArray(res.body.matchedSkills)).toBe(true)
    expect(Array.isArray(res.body.missingSkills)).toBe(true)
    expect(typeof res.body.matchPercentage).toBe('number')
  })
})
