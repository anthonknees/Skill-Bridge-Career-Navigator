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

  it('returns mode: "ai" with transferableSkills when AI succeeds', async () => {
    aiService.extractSkills.mockResolvedValue(['Python'])
    aiService.analyzeGap.mockResolvedValue({
      matched: ['Python'],
      missing: [{ skill: 'AWS', importance: 'high', reason: 'Core cloud platform for this role.' }],
      transferable: [{ skill: 'Communication', relevance: 'Cross-team collaboration in cloud engineering.' }],
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
    expect(Array.isArray(res.body.transferableSkills)).toBe(true)
    expect(typeof res.body.matchPercentage).toBe('number')
    // Missing skills should be enriched with frequency data even in AI mode
    res.body.missingSkills.forEach(item => {
      expect(item).toHaveProperty('skill')
      expect(item).toHaveProperty('frequency')
      expect(item).toHaveProperty('totalJobs')
    })
  })

  it('missing skills include frequency and totalJobs fields', async () => {
    // aiService.extractSkills mocked to throw via beforeEach → fallback path
    const res = await request(app)
      .post('/api/analyze-resume')
      .send({ resumeText: 'I know Python.', targetRole: 'jd-001' })

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.missingSkills)).toBe(true)
    expect(res.body.missingSkills.length).toBeGreaterThan(0)
    res.body.missingSkills.forEach(item => {
      expect(item).toHaveProperty('skill')
      expect(item).toHaveProperty('frequency')
      expect(item).toHaveProperty('totalJobs')
      expect(typeof item.skill).toBe('string')
      expect(typeof item.frequency).toBe('number')
      expect(typeof item.totalJobs).toBe('number')
    })
  })

  it('missing skills are sorted by frequency descending', async () => {
    // aiService.extractSkills mocked to throw via beforeEach → fallback path
    // Send a resume with no matching skills so all target skills appear in missingSkills
    const res = await request(app)
      .post('/api/analyze-resume')
      .send({ resumeText: 'I have experience with writing and public speaking.', targetRole: 'jd-001' })

    expect(res.status).toBe(200)
    const missing = res.body.missingSkills
    expect(missing.length).toBeGreaterThan(1)
    const frequencies = missing.map(s => s.frequency)
    expect(frequencies).toEqual([...frequencies].sort((a, b) => b - a))
  })

  it('returns transferableSkills in fallback mode', async () => {
    // aiService.extractSkills already mocked to throw via beforeEach
    // Resume with soft skills that transfer to the Cloud category
    const res = await request(app)
      .post('/api/analyze-resume')
      .send({
        resumeText: 'I am experienced in communication, project management, and data analysis.',
        targetRole: 'jd-001',
      })

    expect(res.status).toBe(200)
    expect(res.body.mode).toBe('fallback')
    expect(res.body).toHaveProperty('transferableSkills')
    expect(Array.isArray(res.body.transferableSkills)).toBe(true)
  })
})
