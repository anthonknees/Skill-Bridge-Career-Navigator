import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('openai')

function mockOpenAI(responseContent) {
  return async function () {
    const { default: OpenAI } = await import('openai')
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: responseContent } }],
    })
    OpenAI.mockImplementation(function () {
      this.chat = { completions: { create: mockCreate } }
    })
  }
}

describe('aiService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('extractSkills', () => {
    it('returns an array of strings when OpenAI succeeds', async () => {
      await mockOpenAI('["Python", "Docker", "Linux"]')()

      const { extractSkills } = await import('./aiService.js')
      const result = await extractSkills('I have experience with Python, Docker, and Linux.')

      expect(Array.isArray(result)).toBe(true)
      expect(result).toContain('Python')
      expect(result).toContain('Docker')
      expect(result).toContain('Linux')
    })

    it('throws when OpenAI call fails', async () => {
      const { default: OpenAI } = await import('openai')
      OpenAI.mockImplementation(function () {
        this.chat = {
          completions: { create: vi.fn().mockRejectedValue(new Error('OpenAI API error')) },
        }
      })

      const { extractSkills } = await import('./aiService.js')
      await expect(extractSkills('some resume text')).rejects.toThrow()
    })
  })

  describe('analyzeGap', () => {
    it('returns correct shape with matched, missing, transferable, and matchPercentage', async () => {
      const mockResponse = JSON.stringify({
        matched: ['Python'],
        missing: [{ skill: 'AWS', importance: 'high', reason: 'Core cloud platform for this role.' }],
        transferable: [{ skill: 'Communication', relevance: 'Cross-team collaboration in cloud engineering.' }],
        matchPercentage: 25,
      })
      await mockOpenAI(mockResponse)()

      const { analyzeGap } = await import('./aiService.js')
      const result = await analyzeGap(['Python'], 'jd-001')

      expect(result).toHaveProperty('matched')
      expect(result).toHaveProperty('missing')
      expect(result).toHaveProperty('transferable')
      expect(result).toHaveProperty('matchPercentage')
      expect(Array.isArray(result.matched)).toBe(true)
      expect(Array.isArray(result.missing)).toBe(true)
      expect(Array.isArray(result.transferable)).toBe(true)
      expect(typeof result.matchPercentage).toBe('number')
    })
  })

  describe('generateRoadmap', () => {
    it('returns a roadmap array with correct shape', async () => {
      const mockResponse = JSON.stringify([
        {
          skill: 'Docker',
          priority: 1,
          reason: 'Foundational for cloud roles',
          estimatedWeeks: 2,
          courses: [{ title: 'Docker Mastery', provider: 'Udemy', hours: 10, free: false }],
        },
      ])
      await mockOpenAI(mockResponse)()

      const { generateRoadmap } = await import('./aiService.js')
      const result = await generateRoadmap(['Docker'], '3 months')

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('skill')
      expect(result[0]).toHaveProperty('priority')
      expect(result[0]).toHaveProperty('reason')
      expect(result[0]).toHaveProperty('estimatedWeeks')
      expect(result[0]).toHaveProperty('courses')
      expect(Array.isArray(result[0].courses)).toBe(true)
    })
  })
})
