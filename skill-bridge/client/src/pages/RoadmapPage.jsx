import { useLocation, Link } from 'react-router-dom'
import Roadmap from '../components/Roadmap'

export default function RoadmapPage() {
  const { state } = useLocation()

  if (!state?.roadmap) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 mb-4">No roadmap data found.</p>
        <Link to="/" className="text-indigo-600 hover:underline">
          Go back to start
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Link to="/analysis" state={state} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
          ← Back to analysis
        </Link>
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
          Start over
        </Link>
      </div>

      <Roadmap data={state.roadmap} />
    </div>
  )
}
