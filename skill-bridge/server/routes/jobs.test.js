import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../index.js'

describe('GET /api/jobs', () => {
  it('returns all jobs as an array', async () => {
    const res = await request(app).get('/api/jobs')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
    expect(res.body[0]).toHaveProperty('id')
    expect(res.body[0]).toHaveProperty('title')
    expect(res.body[0]).toHaveProperty('category')
  })

  it('filters jobs by category', async () => {
    const res = await request(app).get('/api/jobs?category=Cloud')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
    res.body.forEach(job => {
      expect(job.category).toBe('Cloud')
    })
  })

  it('filters jobs by keyword search', async () => {
    const res = await request(app).get('/api/jobs?search=terraform')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
    res.body.forEach(job => {
      const searchable = [
        job.title,
        job.description,
        ...(job.required_skills || []),
        ...(job.nice_to_have || []),
      ].join(' ').toLowerCase()
      expect(searchable).toContain('terraform')
    })
  })
})
