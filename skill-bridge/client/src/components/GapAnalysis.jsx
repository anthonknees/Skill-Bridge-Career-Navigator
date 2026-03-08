// Normalize missingSkills — AI mode returns [{skill,importance,reason}], fallback returns strings
function normalizeMissing(missingSkills) {
  return (missingSkills || []).map(s =>
    typeof s === 'string' ? { skill: s, importance: null, reason: null } : s
  )
}

// Normalize transferableSkills — AI mode returns [{skill,relevance}], fallback returns strings
function normalizeTransferable(transferableSkills) {
  return (transferableSkills || []).map(s =>
    typeof s === 'string' ? { skill: s, relevance: null } : s
  )
}

function ModeBadge({ mode }) {
  if (mode === 'ai') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
        AI Analysis
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Fallback Mode
    </span>
  )
}

function FrequencyBar({ frequency, totalJobs }) {
  if (frequency == null) return null
  const color =
    frequency >= 70 ? 'bg-red-400' :
    frequency >= 40 ? 'bg-amber-400' :
    'bg-slate-300'
  const textColor =
    frequency >= 70 ? 'text-red-600' :
    frequency >= 40 ? 'text-amber-600' :
    'text-slate-500'
  return (
    <div className="w-full mt-1 pl-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${frequency}%` }} />
        </div>
        <span className={`text-xs font-medium ${textColor} whitespace-nowrap`}>
          {frequency}% of postings
        </span>
      </div>
    </div>
  )
}

function ImportanceBadge({ importance }) {
  if (!importance) return null
  const styles = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-orange-100 text-orange-700',
    low: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${styles[importance] || styles.low}`}>
      {importance}
    </span>
  )
}

export default function GapAnalysis({ data }) {
  const { extractedSkills = [], targetSkills = [], matchedSkills = [], missingSkills = [], transferableSkills = [], matchPercentage = 0, mode } = data
  const missing = normalizeMissing(missingSkills)
  const transferable = normalizeTransferable(transferableSkills)

  const matchColor =
    matchPercentage >= 70 ? 'text-green-600' :
    matchPercentage >= 40 ? 'text-amber-600' :
    'text-red-600'

  const barColor =
    matchPercentage >= 70 ? 'bg-green-500' :
    matchPercentage >= 40 ? 'bg-amber-500' :
    'bg-red-500'

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800">Gap Analysis</h2>
        <ModeBadge mode={mode} />
      </div>

      {/* Match percentage card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-end gap-3 mb-3">
          <span className={`text-5xl font-bold ${matchColor}`}>{matchPercentage}%</span>
          <span className="text-slate-500 text-sm pb-2">skill match with target role</span>
        </div>
        {/* Stacked progress bar */}
        <div className="flex rounded-full overflow-hidden h-3 bg-slate-100 mb-2">
          <div
            className={`${barColor} transition-all duration-700`}
            style={{ width: `${matchPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>{matchedSkills.length} matched</span>
          <span>{missing.length} missing</span>
          <span>{targetSkills.length} required total</span>
        </div>
        {transferable.length > 0 && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            You also have <span className="font-semibold">{transferable.length} transferable skill{transferable.length !== 1 ? 's' : ''}</span> that are valuable in this field.
          </p>
        )}
      </div>

      {/* Skills grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Matched */}
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
            <span className="text-base">✓</span>
            You have ({matchedSkills.length})
          </h3>
          {matchedSkills.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No matching skills found</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {matchedSkills.map(skill => (
                <span key={skill} className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Transferable */}
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
            <span className="text-base">⇄</span>
            Transferable ({transferable.length})
          </h3>
          {transferable.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No transferable skills detected</p>
          ) : (
            <div className="flex flex-col gap-2">
              {transferable.map(({ skill, relevance }) => (
                <div key={skill} className="flex flex-wrap items-start gap-2">
                  <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                    {skill}
                  </span>
                  {relevance && (
                    <p className="w-full text-xs text-slate-500 mt-0.5 pl-1">{relevance}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Missing */}
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
            <span className="text-base">✗</span>
            You need ({missing.length})
          </h3>
          {missing.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No missing skills — great match!</p>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {missing.map(({ skill, importance, reason, frequency, totalJobs }) => (
                  <div key={skill} className="flex flex-wrap items-start gap-2">
                    <span className="text-xs font-medium bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full">
                      {skill}
                    </span>
                    <ImportanceBadge importance={importance} />
                    {reason && (
                      <p className="w-full text-xs text-slate-500 mt-0.5 pl-1">{reason}</p>
                    )}
                    <FrequencyBar frequency={frequency} totalJobs={totalJobs} />
                  </div>
                ))}
              </div>
              {missing[0]?.totalJobs != null && (
                <p className="mt-3 text-xs text-slate-400 border-t border-slate-100 pt-2">
                  Based on {missing[0].totalJobs} job descriptions for this role category
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Extracted skills */}
      {extractedSkills.length > 0 && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Skills extracted from your resume ({extractedSkills.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {extractedSkills.map(skill => (
              <span key={skill} className="text-xs bg-white text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
