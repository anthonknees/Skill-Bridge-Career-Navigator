import { useState } from 'react'

const STATUS_OPTIONS = ['not-started', 'in-progress', 'completed']
const STATUS_LABELS = { 'not-started': 'Not Started', 'in-progress': 'In Progress', completed: 'Completed' }
const STATUS_STYLES = {
  'not-started': 'bg-slate-100 text-slate-600 border-slate-200',
  'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
}

const IMPORTANCE_STYLES = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-500',
}
const IMPORTANCE_LABELS = { high: 'High Demand', medium: 'Medium Demand', low: 'Low Demand' }

function ImportanceBadge({ importance }) {
  if (!importance) return null
  const styles = IMPORTANCE_STYLES[importance] || IMPORTANCE_STYLES.low
  const label = IMPORTANCE_LABELS[importance] || importance
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${styles}`}>
      {label}
    </span>
  )
}

function ModeBadge({ mode }) {
  if (mode === 'ai') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
        AI Roadmap
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

export default function Roadmap({ data }) {
  const { roadmap = [], mode } = data
  const [statuses, setStatuses] = useState(() =>
    Object.fromEntries(roadmap.map(item => [item.skill, 'not-started']))
  )

  function cycleStatus(skill) {
    setStatuses(prev => {
      const current = prev[skill]
      const next = STATUS_OPTIONS[(STATUS_OPTIONS.indexOf(current) + 1) % STATUS_OPTIONS.length]
      return { ...prev, [skill]: next }
    })
  }

  const completed = Object.values(statuses).filter(s => s === 'completed').length
  const inProgress = Object.values(statuses).filter(s => s === 'in-progress').length

  if (roadmap.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 text-lg">No skills to learn — you already have them all!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Learning Roadmap</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {completed} of {roadmap.length} skills completed
            {inProgress > 0 && `, ${inProgress} in progress`}
          </p>
        </div>
        <ModeBadge mode={mode} />
      </div>

      {/* Progress bar */}
      <div className="flex rounded-full overflow-hidden h-2 bg-slate-100">
        <div
          className="bg-green-500 transition-all duration-500"
          style={{ width: `${(completed / roadmap.length) * 100}%` }}
        />
        <div
          className="bg-blue-400 transition-all duration-500"
          style={{ width: `${(inProgress / roadmap.length) * 100}%` }}
        />
      </div>

      {/* Skill cards */}
      <div className="space-y-4">
        {roadmap.map((item, idx) => {
          const status = statuses[item.skill] || 'not-started'
          const isCompleted = status === 'completed'
          return (
            <div
              key={item.skill}
              className={`bg-white rounded-xl border shadow-sm p-5 transition-opacity ${
                isCompleted ? 'opacity-60 border-slate-200' : 'border-slate-200 hover:border-indigo-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Priority + skill name */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                    {item.priority || idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className={`font-semibold text-slate-800 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                        {item.skill}
                      </h3>
                      <ImportanceBadge importance={item.importance} />
                    </div>
                    {item.estimatedWeeks && (
                      <span className="text-xs text-slate-400">{item.estimatedWeeks} week{item.estimatedWeeks !== 1 ? 's' : ''} estimated</span>
                    )}
                  </div>
                </div>

                {/* Status toggle */}
                <button
                  onClick={() => cycleStatus(item.skill)}
                  className={`flex-shrink-0 text-xs font-semibold border px-3 py-1.5 rounded-full transition-colors cursor-pointer ${STATUS_STYLES[status]}`}
                >
                  {STATUS_LABELS[status]}
                </button>
              </div>

              {item.reason && (
                <p className="text-sm text-slate-500 mt-3 ml-10">{item.reason}</p>
              )}

              {/* Courses */}
              {item.courses && item.courses.length > 0 && (
                <div className="mt-4 ml-10 space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Courses</p>
                  {item.courses.map((course, cIdx) => (
                    <div key={cIdx} className="flex items-center justify-between gap-3 bg-slate-50 rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{course.title}</p>
                        <p className="text-xs text-slate-400">{course.provider}{course.hours ? ` · ${course.hours}h` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {course.free !== undefined && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${course.free ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {course.free ? 'Free' : 'Paid'}
                          </span>
                        )}
                        {course.url && course.url !== '#' && (
                          <a href={course.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">
                            Open
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Certifications */}
              {item.certifications && item.certifications.length > 0 && (
                <div className="mt-4 ml-10 space-y-2">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-1">
                    <span>🏆</span> Recommended Certifications
                  </p>
                  {item.certifications.map((cert, cIdx) => (
                    <div key={cIdx} className="flex items-start justify-between gap-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <a
                          href={cert.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-amber-800 hover:underline"
                        >
                          {cert.name}
                        </a>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {cert.issuer}
                          {cert.estimatedPrepHours ? ` · ~${cert.estimatedPrepHours}h prep` : ''}
                        </p>
                      </div>
                      {cert.level && (
                        <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          cert.level === 'beginner' ? 'bg-green-100 text-green-700' :
                          cert.level === 'intermediate' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {cert.level}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
