import { describe, it, expect } from 'vitest'
import { extractSkills } from './fallbackService.js'

describe('fallbackService.extractSkills', () => {
  it('returns known skills found in resume text', () => {
    const resumeText = 'I have experience with Python, Docker, and AWS. I also know SQL and Linux.'
    const skills = extractSkills(resumeText)
    expect(skills).toContain('Python')
    expect(skills).toContain('Docker')
    expect(skills).toContain('AWS')
    expect(skills).toContain('SQL')
    expect(skills).toContain('Linux')
  })

  it('returns empty array for empty string', () => {
    const skills = extractSkills('')
    expect(Array.isArray(skills)).toBe(true)
    expect(skills.length).toBe(0)
  })

  it('resolves aliases to canonical skill names', () => {
    const resumeText = 'Proficient in ReactJS, golang, and k8s. Also used amazon aws for cloud projects.'
    const skills = extractSkills(resumeText)
    expect(skills).toContain('React')
    expect(skills).toContain('Go')
    expect(skills).toContain('Kubernetes')
    expect(skills).toContain('AWS')
  })
})
