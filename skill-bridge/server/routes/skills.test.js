import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../index.js'

describe('GET /api/skills/frequency', () => {
  it('returns correct shape for a valid category', async () => {
    const res = await request(app)
      .get('/api/skills/frequency?category=Cloud')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
    res.body.forEach(entry => {
      expect(entry).toHaveProperty('skill')
      expect(entry).toHaveProperty('count')
      expect(entry).toHaveProperty('total')
      expect(entry).toHaveProperty('percentage')
    })
    // Sorted descending by count
    const counts = res.body.map(e => e.count)
    expect(counts).toEqual([...counts].sort((a, b) => b - a))
  })

  it('returns 400 when category query param is missing', async () => {
    const res = await request(app).get('/api/skills/frequency')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns empty array for an unknown category', async () => {
    const res = await request(app).get('/api/skills/frequency?category=UnknownCategory')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(0)
  })
})
