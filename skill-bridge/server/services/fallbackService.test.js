import { describe, it, expect } from 'vitest'
import { extractSkills, analyzeGap, generateRoadmap, identifyTransferableSkills, getSkillFrequency } from './fallbackService.js'

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

describe('fallbackService.analyzeGap', () => {
  it('returns matched, missing, and matchPercentage for a partial match', () => {
    // Cloud Engineer (jd-001) requires: AWS, Terraform, Docker, Kubernetes, CI/CD, Python, Linux, Networking
    const skills = ['Python', 'Docker', 'Linux']
    const result = analyzeGap(skills, 'jd-001')
    expect(result).toHaveProperty('matchedSkills')
    expect(result).toHaveProperty('missingSkills')
    expect(result).toHaveProperty('matchPercentage')
    expect(result).toHaveProperty('targetSkills')
    expect(result.matchedSkills).toContain('Python')
    expect(result.matchedSkills).toContain('Docker')
    expect(result.matchedSkills).toContain('Linux')
    expect(result.missingSkills).toContain('AWS')
    expect(result.missingSkills).toContain('Terraform')
    expect(result.matchPercentage).toBeGreaterThan(0)
    expect(result.matchPercentage).toBeLessThan(100)
  })

  it('returns 0% match when no skills overlap', () => {
    // Cloud Engineer requires AWS, Terraform, Docker, etc. — none of these are frontend skills
    const skills = ['React', 'TypeScript', 'CSS']
    const result = analyzeGap(skills, 'jd-001')
    expect(result.matchPercentage).toBe(0)
    expect(result.matchedSkills.length).toBe(0)
    expect(result.missingSkills.length).toBeGreaterThan(0)
  })

  it('returns 100% match when all required skills are present', () => {
    // Cloud Engineer (jd-001) requires: AWS, Terraform, Docker, Kubernetes, CI/CD, Python, Linux, Networking
    const skills = ['AWS', 'Terraform', 'Docker', 'Kubernetes', 'CI/CD', 'Python', 'Linux', 'Networking']
    const result = analyzeGap(skills, 'jd-001')
    expect(result.matchPercentage).toBe(100)
    expect(result.matchedSkills.length).toBe(8)
    expect(result.missingSkills.length).toBe(0)
  })
})

describe('fallbackService.generateRoadmap', () => {
  it('returns a roadmap with courses for each missing skill', () => {
    const result = generateRoadmap(['AWS', 'Docker', 'Kubernetes'])
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(3)
    result.forEach(entry => {
      expect(entry).toHaveProperty('skill')
      expect(entry).toHaveProperty('priority')
      expect(entry).toHaveProperty('courses')
      expect(Array.isArray(entry.courses)).toBe(true)
      expect(entry.courses.length).toBeGreaterThan(0)
    })
    // Lower priority number = higher priority, so AWS/Docker (priority 1) should come before Kubernetes (priority 2)
    const priorities = result.map(e => e.priority)
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b))
  })

  it('returns empty array when missingSkills is empty', () => {
    const result = generateRoadmap([])
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(0)
  })
})

describe('fallbackService.identifyTransferableSkills', () => {
  it('returns transferable skills for a career switcher targeting a different category', () => {
    // Marketing-type skills: Communication and Data Analysis transfer to Cloud
    const userSkills = ['Communication', 'Data Analysis', 'Project Management']
    const result = identifyTransferableSkills(userSkills, 'Cloud')
    expect(result).toHaveProperty('transferable')
    expect(result).toHaveProperty('notRelevant')
    expect(result.transferable).toContain('Communication')
    expect(result.transferable).toContain('Data Analysis')
  })

  it('returns empty transferable array when user skills are already in the target category', () => {
    // Cloud skills targeting Cloud — handled by analyzeGap as matched/missing, not transferable
    const userSkills = ['AWS', 'Docker', 'Kubernetes']
    const result = identifyTransferableSkills(userSkills, 'Cloud')
    expect(result.transferable).toEqual([])
  })

  it('returns empty transferable array when no user skills transfer to the target category', () => {
    // Frontend-only skills with no transferable_to Cloud entry
    const userSkills = ['React', 'CSS', 'HTML']
    const result = identifyTransferableSkills(userSkills, 'Cloud')
    expect(result.transferable).toEqual([])
    expect(result.notRelevant.length).toBeGreaterThan(0)
  })
})

describe('fallbackService.getSkillFrequency', () => {
  it('returns skills sorted by count descending for a valid category', () => {
    const result = getSkillFrequency('Cloud')
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    result.forEach(entry => {
      expect(entry).toHaveProperty('skill')
      expect(entry).toHaveProperty('count')
      expect(entry).toHaveProperty('total')
      expect(entry).toHaveProperty('percentage')
      expect(typeof entry.skill).toBe('string')
      expect(typeof entry.count).toBe('number')
      expect(typeof entry.total).toBe('number')
      expect(typeof entry.percentage).toBe('number')
    })
    // Sorted descending by count
    const counts = result.map(e => e.count)
    expect(counts).toEqual([...counts].sort((a, b) => b - a))
    // Skills appearing in all Cloud JDs should rank near the top
    const skillNames = result.map(e => e.skill)
    expect(skillNames).toContain('Docker')
    expect(skillNames).toContain('Kubernetes')
  })

  it('returns empty array for an invalid or unknown category', () => {
    const result = getSkillFrequency('InvalidCategory')
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(0)
  })
})
