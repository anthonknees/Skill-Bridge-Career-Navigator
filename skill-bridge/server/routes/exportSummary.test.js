import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../index.js'
import * as aiService from '../services/aiService.js'

vi.mock('../services/aiService.js')

const validAnalysis = {
  targetRole: 'jd-001',
  matchPercentage: 38,
  matchedSkills: ['Python', 'Docker', 'Linux'],
  missingSkills: [
    { skill: 'Kubernetes', frequency: 83, totalJobs: 6 },
    { skill: 'AWS', frequency: 67, totalJobs: 6 },
    { skill: 'Terraform', frequency: 50, totalJobs: 6 },
    { skill: 'CI/CD', frequency: 50, totalJobs: 6 },
    { skill: 'Networking', frequency: 33, totalJobs: 6 },
  ],
  transferableSkills: [
    { skill: 'Communication', relevance: 'Cross-team collaboration.' },
  ],
}

describe('POST /api/export-summary', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Default: AI throws so tests run through the fallback path
    aiService.generateSummary.mockRejectedValue(new Error('AI unavailable'))
  })

  it('returns a summary string for valid analysis data', async () => {
    const res = await request(app)
      .post('/api/export-summary')
      .send(validAnalysis)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('summary')
    expect(typeof res.body.summary).toBe('string')
    expect(res.body.summary.length).toBeGreaterThan(0)
    expect(res.body).toHaveProperty('mode')
    expect(['ai', 'fallback']).toContain(res.body.mode)
  })

  it('fallback summary includes match percentage and top 3 missing skills', async () => {
    const res = await request(app)
      .post('/api/export-summary')
      .send(validAnalysis)

    expect(res.status).toBe(200)
    const { summary } = res.body
    expect(summary).toContain('38%')
    expect(summary).toContain('Kubernetes')
    expect(summary).toContain('AWS')
    expect(summary).toContain('Terraform')
  })

  it('returns a graceful summary when analysis data has empty skill arrays', async () => {
    const res = await request(app)
      .post('/api/export-summary')
      .send({
        targetRole: 'jd-001',
        matchPercentage: 100,
        matchedSkills: ['AWS', 'Docker'],
        missingSkills: [],
        transferableSkills: [],
      })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('summary')
    expect(typeof res.body.summary).toBe('string')
    expect(res.body.summary.length).toBeGreaterThan(0)
  })

  it('returns mode: "ai" with summary when AI succeeds', async () => {
    aiService.generateSummary.mockResolvedValue(
      'You have strong foundational skills with a 38% match. Your next step is to focus on Kubernetes.'
    )

    const res = await request(app)
      .post('/api/export-summary')
      .send(validAnalysis)

    expect(res.status).toBe(200)
    expect(res.body.mode).toBe('ai')
    expect(typeof res.body.summary).toBe('string')
    expect(res.body.summary.length).toBeGreaterThan(0)
  })
})
