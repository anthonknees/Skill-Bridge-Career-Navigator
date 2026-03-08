import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import GapAnalysis from '../components/GapAnalysis'
import { generateRoadmap, exportSummary } from '../services/api'

export default function AnalysisPage({ useAI }) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const [exportError, setExportError] = useState('')
  const [summaryText, setSummaryText] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

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

  async function handleExportSummary() {
    setExportLoading(true)
    setExportError('')
    setCopied(false)
    try {
      const payload = { ...analysis, targetRole: state.targetRole }
      const result = await exportSummary(payload, useAI)
      setSummaryText(result.summary)
      setModalOpen(true)
    } catch (err) {
      setExportError(err.message || 'Failed to generate summary. Please try again.')
    } finally {
      setExportLoading(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleGenerateRoadmap() {
    setLoading(true)
    setError('')
    try {
      const frequencyData = (analysis.missingSkills || [])
        .filter(s => typeof s === 'object' && s.frequency != null)
        .map(s => ({ skill: s.skill, frequency: s.frequency }))
      const result = await generateRoadmap(missingSkillNames, '3 months', useAI, frequencyData.length > 0 ? frequencyData : null)
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
      <GapAnalysis data={analysis} customJobTitle={state.customJobTitle} />

      {/* Export Summary */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm">
        <div>
          <p className="font-semibold text-slate-700 text-sm">Share with your mentor</p>
          <p className="text-xs text-slate-500 mt-0.5">Generate a plain-text summary you can copy into notes or email.</p>
        </div>
        <button
          onClick={handleExportSummary}
          disabled={exportLoading}
          className="flex-shrink-0 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {exportLoading ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            'Export Summary'
          )}
        </button>
      </div>

      {exportError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {exportError}
        </div>
      )}

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
      {/* Export Summary Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[85vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-800">Skills Assessment Summary</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Summary text */}
            <pre className="flex-1 overflow-y-auto px-6 py-4 text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
              {summaryText}
            </pre>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button
                onClick={() => setModalOpen(false)}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors px-4 py-2 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={handleCopy}
                className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <span>✓</span>
                    Copied!
                  </>
                ) : (
                  'Copy to Clipboard'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
