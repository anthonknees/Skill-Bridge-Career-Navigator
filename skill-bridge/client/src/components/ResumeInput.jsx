import { useState, useEffect } from 'react'
import { getSamples, getJobs } from '../services/api'

const RESUME_MAX_CHARS = 10000
const JOB_MAX_CHARS = 15000

export default function ResumeInput({ onSubmit, loading }) {
  const [mode, setMode] = useState('role') // 'role' | 'job-listing'
  const [resumeText, setResumeText] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [category, setCategory] = useState('')
  const [jobText, setJobText] = useState('')
  const [jobs, setJobs] = useState([])
  const [categories, setCategories] = useState([])
  const [samples, setSamples] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    getJobs()
      .then(data => {
        setJobs(data)
        const cats = [...new Set(data.map(j => j.category))].sort()
        setCategories(cats)
      })
      .catch(() => {})
    getSamples()
      .then(setSamples)
      .catch(() => {})
  }, [])

  const filteredJobs = category ? jobs.filter(j => j.category === category) : jobs
  const resumeOverLimit = resumeText.length > RESUME_MAX_CHARS
  const jobOverLimit = jobText.length > JOB_MAX_CHARS

  function loadSample(id) {
    const sample = samples.find(s => s.id === id)
    if (!sample) return
    const text = [
      sample.summary,
      `Skills: ${sample.skills.join(', ')}`,
      ...sample.experience.map(e => `${e.title} at ${e.company} (${e.duration}) — ${e.description}`),
      sample.education,
    ].join('\n\n')
    setResumeText(text)
  }

  function handleModeChange(next) {
    setMode(next)
    setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!resumeText.trim()) return setError('Please paste your resume or load a sample.')
    if (mode === 'role') {
      if (!targetRole) return setError('Please select a target job role.')
      setError('')
      onSubmit(resumeText.trim(), targetRole, null)
    } else {
      if (!jobText.trim()) return setError('Please paste a job listing.')
      setError('')
      onSubmit(resumeText.trim(), null, jobText.trim())
    }
  }

  const isRoleMode = mode === 'role'
  const submitDisabled =
    loading ||
    resumeOverLimit ||
    !resumeText.trim() ||
    (isRoleMode ? !targetRole : !jobText.trim() || jobOverLimit)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 gap-1">
        <button
          type="button"
          onClick={() => handleModeChange('role')}
          className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
            isRoleMode
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Match against a Role
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('job-listing')}
          className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
            !isRoleMode
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Paste a Job Listing
        </button>
      </div>

      {/* Sample loader */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Load a sample resume
        </label>
        <select
          onChange={e => e.target.value && loadSample(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          defaultValue=""
        >
          <option value="" disabled>Choose a demo profile...</option>
          {samples.map(s => (
            <option key={s.id} value={s.id}>{s.name} — {s.summary.slice(0, 60)}…</option>
          ))}
        </select>
      </div>

      {/* Resume textarea */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Resume text
        </label>
        <textarea
          value={resumeText}
          onChange={e => setResumeText(e.target.value)}
          rows={10}
          placeholder="Paste your resume here, or load a sample above..."
          className={`w-full border rounded-lg px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 resize-y ${
            resumeOverLimit
              ? 'border-red-400 focus:ring-red-400'
              : 'border-slate-300 focus:ring-indigo-400'
          }`}
        />
        <div className={`text-xs mt-1 text-right ${resumeOverLimit ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
          {resumeText.length.toLocaleString()} / {RESUME_MAX_CHARS.toLocaleString()} characters
          {resumeOverLimit && ' — exceeds limit'}
        </div>
      </div>

      {/* Role mode: category filter + role selector */}
      {isRoleMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Filter by category
            </label>
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setTargetRole('') }}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Target job role <span className="text-red-400">*</span>
            </label>
            <select
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Select a role...</option>
              {filteredJobs.map(j => (
                <option key={j.id} value={j.id}>{j.title} — {j.company}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Job listing mode: job text textarea */}
      {!isRoleMode && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Paste job listing here
          </label>
          <textarea
            value={jobText}
            onChange={e => setJobText(e.target.value)}
            rows={8}
            placeholder="Paste the full job description here..."
            className={`w-full border rounded-lg px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 resize-y ${
              jobOverLimit
                ? 'border-red-400 focus:ring-red-400'
                : 'border-slate-300 focus:ring-indigo-400'
            }`}
          />
          <div className={`text-xs mt-1 text-right ${jobOverLimit ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
            {jobText.length.toLocaleString()} / {JOB_MAX_CHARS.toLocaleString()} characters
            {jobOverLimit && ' — exceeds limit'}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitDisabled}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Analyzing...
          </>
        ) : isRoleMode ? (
          'Analyze My Resume'
        ) : (
          'Parse & Analyze'
        )}
      </button>
    </form>
  )
}
