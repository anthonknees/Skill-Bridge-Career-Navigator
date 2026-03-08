import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../index.js'
import * as aiService from '../services/aiService.js'

vi.mock('../services/aiService.js')

describe('POST /api/generate-roadmap', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Default: AI throws so tests run through the fallback path
    aiService.generateRoadmap.mockRejectedValue(new Error('AI unavailable'))
  })

  it('returns a roadmap array with correct shape for valid input', async () => {
    const res = await request(app)
      .post('/api/generate-roadmap')
      .send({ missingSkills: ['AWS', 'Docker'], timeframe: '3 months' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('roadmap')
    expect(res.body).toHaveProperty('mode')
    expect(Array.isArray(res.body.roadmap)).toBe(true)
    expect(res.body.roadmap.length).toBe(2)
    res.body.roadmap.forEach(entry => {
      expect(entry).toHaveProperty('skill')
      expect(entry).toHaveProperty('priority')
      expect(entry).toHaveProperty('importance')
      expect(entry).toHaveProperty('courses')
      expect(Array.isArray(entry.courses)).toBe(true)
    })
    expect(['ai', 'fallback']).toContain(res.body.mode)
  })

  it('returns empty roadmap (not an error) when missingSkills is empty', async () => {
    const res = await request(app)
      .post('/api/generate-roadmap')
      .send({ missingSkills: [], timeframe: '3 months' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('roadmap')
    expect(Array.isArray(res.body.roadmap)).toBe(true)
    expect(res.body.roadmap.length).toBe(0)
  })
})
