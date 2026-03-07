import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import GapAnalysis from '../components/GapAnalysis'
import { generateRoadmap } from '../services/api'

export default function AnalysisPage({ useAI }) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!state?.analysis) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 mb-4">No analysis data found.</p>
        <Link to="/" className="text-indigo-600 hover:underline">
          Go back to start
        </Link>
      </div>
    )
  }

  const { analysis } = state
  const missingSkillNames = (analysis.missingSkills || []).map(s =>
    typeof s === 'string' ? s : s.skill
  )

  async function handleGenerateRoadmap() {
    setLoading(true)
    setError('')
    try {
      const result = await generateRoadmap(missingSkillNames, '3 months', useAI)
      navigate('/roadmap', { state: { roadmap: result, analysis } })
    } catch (err) {
      setError(err.message || 'Failed to generate roadmap. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
        ← Back to resume input
      </Link>

      {/* Analysis component */}
      <GapAnalysis data={analysis} />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Generate Roadmap CTA */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-indigo-800">Ready to close the gap?</p>
          <p className="text-sm text-indigo-600 mt-0.5">
            {missingSkillNames.length > 0
              ? `Generate a personalized roadmap for ${missingSkillNames.length} missing skill${missingSkillNames.length !== 1 ? 's' : ''}.`
              : 'You already meet all the requirements for this role!'}
          </p>
        </div>
        {missingSkillNames.length > 0 && (
          <button
            onClick={handleGenerateRoadmap}
            disabled={loading}
            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Roadmap →'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
