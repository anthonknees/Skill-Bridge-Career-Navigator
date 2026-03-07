import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'data')

function loadJson(filename) {
  return JSON.parse(readFileSync(join(dataDir, filename), 'utf-8'))
}

describe('Synthetic data files have valid structure', () => {
  describe('job_descriptions.json', () => {
    it('is an array of at least 15 job descriptions', () => {
      const jobs = loadJson('job_descriptions.json')
      expect(Array.isArray(jobs)).toBe(true)
      expect(jobs.length).toBeGreaterThanOrEqual(15)
    })

    it('every job has required keys: id, title, company, category, required_skills, nice_to_have, description', () => {
      const jobs = loadJson('job_descriptions.json')
      const requiredKeys = ['id', 'title', 'company', 'category', 'required_skills', 'nice_to_have', 'description']
      jobs.forEach(job => {
        requiredKeys.forEach(key => {
          expect(job, `job ${job.id} missing key: ${key}`).toHaveProperty(key)
        })
      })
    })

    it('every job has required_skills as a non-empty array', () => {
      const jobs = loadJson('job_descriptions.json')
      jobs.forEach(job => {
        expect(Array.isArray(job.required_skills), `job ${job.id} required_skills not array`).toBe(true)
        expect(job.required_skills.length, `job ${job.id} required_skills empty`).toBeGreaterThan(0)
      })
    })

    it('has jobs across at least 4 categories', () => {
      const jobs = loadJson('job_descriptions.json')
      const categories = new Set(jobs.map(j => j.category))
      expect(categories.size).toBeGreaterThanOrEqual(4)
    })
  })

  describe('skills_taxonomy.json', () => {
    it('is an object (not an array)', () => {
      const taxonomy = loadJson('skills_taxonomy.json')
      expect(typeof taxonomy).toBe('object')
      expect(Array.isArray(taxonomy)).toBe(false)
    })

    it('has at least 20 skills defined', () => {
      const taxonomy = loadJson('skills_taxonomy.json')
      expect(Object.keys(taxonomy).length).toBeGreaterThanOrEqual(20)
    })

    it('every skill entry has category, aliases, and related fields', () => {
      const taxonomy = loadJson('skills_taxonomy.json')
      Object.entries(taxonomy).forEach(([skill, data]) => {
        expect(data, `skill "${skill}" missing category`).toHaveProperty('category')
        expect(data, `skill "${skill}" missing aliases`).toHaveProperty('aliases')
        expect(data, `skill "${skill}" missing related`).toHaveProperty('related')
        expect(Array.isArray(data.aliases), `skill "${skill}" aliases not array`).toBe(true)
        expect(Array.isArray(data.related), `skill "${skill}" related not array`).toBe(true)
      })
    })
  })

  describe('sample_resumes.json', () => {
    it('is an array of at least 3 sample resumes', () => {
      const resumes = loadJson('sample_resumes.json')
      expect(Array.isArray(resumes)).toBe(true)
      expect(resumes.length).toBeGreaterThanOrEqual(3)
    })

    it('every resume has required keys: id, name, summary, skills, experience, education', () => {
      const resumes = loadJson('sample_resumes.json')
      const requiredKeys = ['id', 'name', 'summary', 'skills', 'experience', 'education']
      resumes.forEach(resume => {
        requiredKeys.forEach(key => {
          expect(resume, `resume ${resume.id} missing key: ${key}`).toHaveProperty(key)
        })
      })
    })

    it('every resume has skills as a non-empty array', () => {
      const resumes = loadJson('sample_resumes.json')
      resumes.forEach(resume => {
        expect(Array.isArray(resume.skills), `resume ${resume.id} skills not array`).toBe(true)
        expect(resume.skills.length, `resume ${resume.id} skills empty`).toBeGreaterThan(0)
      })
    })
  })

  describe('courses.json', () => {
    it('is an array of skill-to-courses mappings', () => {
      const courses = loadJson('courses.json')
      expect(Array.isArray(courses)).toBe(true)
      expect(courses.length).toBeGreaterThan(0)
    })

    it('every entry has skill, priority, and courses fields', () => {
      const courses = loadJson('courses.json')
      courses.forEach(entry => {
        expect(entry, `courses entry missing skill`).toHaveProperty('skill')
        expect(entry, `courses entry missing priority`).toHaveProperty('priority')
        expect(entry, `courses entry missing courses`).toHaveProperty('courses')
        expect(Array.isArray(entry.courses), `entry for "${entry.skill}" courses not array`).toBe(true)
      })
    })

    it('every course has title, provider, url, hours, and free fields', () => {
      const courses = loadJson('courses.json')
      courses.forEach(entry => {
        entry.courses.forEach(course => {
          expect(course).toHaveProperty('title')
          expect(course).toHaveProperty('provider')
          expect(course).toHaveProperty('url')
          expect(course).toHaveProperty('hours')
          expect(course).toHaveProperty('free')
          expect(typeof course.free).toBe('boolean')
          expect(typeof course.hours).toBe('number')
        })
      })
    })
  })
})
