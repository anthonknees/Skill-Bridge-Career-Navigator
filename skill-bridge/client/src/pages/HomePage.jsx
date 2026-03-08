import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ResumeInput from '../components/ResumeInput'
import { analyzeResume, parseJobListing } from '../services/api'

export default function HomePage({ useAI }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [parseLoading, setParseLoading] = useState(false)
  const [parsedJob, setParsedJob] = useState(null)
  const [error, setError] = useState('')

  async function handleSubmit(resumeText, targetRole, jobText) {
    setLoading(true)
    setError('')
    setParsedJob(null)

    try {
      if (jobText) {
        // Step 1: parse the job listing
        setParseLoading(true)
        const parsed = await parseJobListing(jobText, useAI)
        setParseLoading(false)
        setParsedJob(parsed)

        // Step 2: analyze resume against extracted skills
        const result = await analyzeResume(resumeText, null, useAI, parsed.extractedSkills)
        navigate('/analysis', {
          state: {
            analysis: result,
            resumeText,
            customJobTitle: parsed.title,
            customJobCategory: parsed.category,
          },
        })
      } else {
        const result = await analyzeResume(resumeText, targetRole, useAI)
        navigate('/analysis', { state: { analysis: result, resumeText, targetRole } })
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setParseLoading(false)
      setParsedJob(null)
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

      {/* Parse loading indicator */}
      {parseLoading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
          <span className="inline-block w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          Parsing job listing...
        </div>
      )}

      {/* Parsed job preview — shown while analyze call runs */}
      {parsedJob && loading && (
        <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-indigo-800">{parsedJob.title}</span>
            {parsedJob.category && (
              <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                {parsedJob.category}
              </span>
            )}
            <span className="text-xs text-indigo-500 ml-auto flex items-center gap-1">
              <span className="inline-block w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </span>
          </div>
          <div>
            <span className="text-xs text-indigo-600 font-medium mr-1">Found:</span>
            <span className="flex flex-wrap gap-1 mt-1">
              {parsedJob.extractedSkills.map(skill => (
                <span
                  key={skill}
                  className="inline-block text-xs font-medium bg-white text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}
    </div>
  )
}
