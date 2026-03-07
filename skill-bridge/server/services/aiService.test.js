import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('openai')

describe('aiService.extractSkills', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns an array of strings when OpenAI succeeds', async () => {
    const { default: OpenAI } = await import('openai')
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: '["Python", "Docker", "Linux"]' } }],
    })
    OpenAI.mockImplementation(function () {
      this.chat = { completions: { create: mockCreate } }
    })

    const { extractSkills } = await import('./aiService.js')
    const result = await extractSkills('I have experience with Python, Docker, and Linux.')

    expect(Array.isArray(result)).toBe(true)
    expect(result).toContain('Python')
    expect(result).toContain('Docker')
    expect(result).toContain('Linux')
  })

  it('throws when OpenAI call fails', async () => {
    const { default: OpenAI } = await import('openai')
    const mockCreate = vi.fn().mockRejectedValue(new Error('OpenAI API error'))
    OpenAI.mockImplementation(function () {
      this.chat = { completions: { create: mockCreate } }
    })

    const { extractSkills } = await import('./aiService.js')
    await expect(extractSkills('some resume text')).rejects.toThrow()
  })
})
