import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ResumeInput from '../components/ResumeInput'
import { analyzeResume } from '../services/api'

export default function HomePage({ useAI }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(resumeText, targetRole) {
    setLoading(true)
    setError('')
    try {
      const result = await analyzeResume(resumeText, targetRole, useAI)
      navigate('/analysis', { state: { analysis: result, resumeText, targetRole } })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-3">
          Find Your Skill Gap.<br />
          <span className="text-indigo-600">Build Your Path.</span>
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Paste your resume, pick your dream role, and get a concrete plan to close the gap.
          Powered by AI with a rule-based fallback.
        </p>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        <ResumeInput onSubmit={handleSubmit} loading={loading} />
      </div>

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}
    </div>
  )
}
