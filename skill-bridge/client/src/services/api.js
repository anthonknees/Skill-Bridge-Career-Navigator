const API_BASE = '/api'

async function request(url, options = {}) {
  const res = await fetch(url, options)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export function analyzeResume(resumeText, targetRole, useAI = true) {
  const url = useAI ? `${API_BASE}/analyze-resume` : `${API_BASE}/analyze-resume?forceMode=fallback`
  return request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText, targetRole }),
  })
}

export function generateRoadmap(missingSkills, timeframe = '3 months', useAI = true) {
  const url = useAI ? `${API_BASE}/generate-roadmap` : `${API_BASE}/generate-roadmap?forceMode=fallback`
  return request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ missingSkills, timeframe }),
  })
}

export function getJobs(category = '', search = '') {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (search) params.set('search', search)
  return request(`${API_BASE}/jobs?${params}`)
}

export function getSamples() {
  return request(`${API_BASE}/samples`)
}

export function exportSummary(analysisData, useAI = true) {
  const url = useAI ? `${API_BASE}/export-summary` : `${API_BASE}/export-summary?forceMode=fallback`
  return request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(analysisData),
  })
}
