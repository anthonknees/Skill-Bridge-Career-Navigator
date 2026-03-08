import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../index.js'
import * as aiService from '../services/aiService.js'

vi.mock('../services/aiService.js')

const SAMPLE_JOB = `Senior Cloud Engineer

We are looking for a Cloud Engineer to join our infrastructure team.

Requirements:
- 3+ years of experience with AWS and Terraform
- Strong knowledge of Docker and Kubernetes
- Experience with CI/CD pipelines
- Proficiency in Python and Linux
- Understanding of networking fundamentals`

describe('POST /api/parse-job-listing', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Default: AI throws so tests run through the fallback path
    aiService.parseJobListing.mockRejectedValue(new Error('AI unavailable'))
  })

  it('returns title, extractedSkills, category, and mode for valid job text', async () => {
    const res = await request(app)
      .post('/api/parse-job-listing')
      .send({ jobText: SAMPLE_JOB })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('title')
    expect(res.body).toHaveProperty('extractedSkills')
    expect(res.body).toHaveProperty('category')
    expect(res.body).toHaveProperty('mode')
    expect(typeof res.body.title).toBe('string')
    expect(res.body.title.length).toBeGreaterThan(0)
    expect(Array.isArray(res.body.extractedSkills)).toBe(true)
    expect(res.body.extractedSkills.length).toBeGreaterThan(0)
    expect(typeof res.body.category).toBe('string')
    expect(['ai', 'fallback']).toContain(res.body.mode)
  })

  it('returns 400 when jobText is missing', async () => {
    const res = await request(app)
      .post('/api/parse-job-listing')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 when jobText is empty', async () => {
    const res = await request(app)
      .post('/api/parse-job-listing')
      .send({ jobText: '   ' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 413 when jobText exceeds 15,000 characters', async () => {
    const res = await request(app)
      .post('/api/parse-job-listing')
      .send({ jobText: 'a'.repeat(15001) })

    expect(res.status).toBe(413)
    expect(res.body).toHaveProperty('error')
  })

  it('fallback extracts known skills from job text', async () => {
    // AI mocked to throw via beforeEach → fallback path
    const res = await request(app)
      .post('/api/parse-job-listing')
      .send({ jobText: SAMPLE_JOB })

    expect(res.status).toBe(200)
    expect(res.body.mode).toBe('fallback')
    expect(res.body.extractedSkills).toContain('AWS')
    expect(res.body.extractedSkills).toContain('Docker')
    expect(res.body.extractedSkills).toContain('Kubernetes')
    expect(res.body.extractedSkills).toContain('Python')
  })

  it('returns mode: "ai" when AI succeeds', async () => {
    aiService.parseJobListing.mockResolvedValue({
      title: 'Senior Cloud Engineer',
      extractedSkills: ['AWS', 'Terraform', 'Docker', 'Kubernetes', 'Python'],
      category: 'Cloud',
    })

    const res = await request(app)
      .post('/api/parse-job-listing')
      .send({ jobText: SAMPLE_JOB })

    expect(res.status).toBe(200)
    expect(res.body.mode).toBe('ai')
    expect(res.body.title).toBe('Senior Cloud Engineer')
    expect(Array.isArray(res.body.extractedSkills)).toBe(true)
    expect(res.body.category).toBe('Cloud')
  })
})
