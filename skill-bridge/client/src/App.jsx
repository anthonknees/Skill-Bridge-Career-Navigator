import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import './App.css'
import HomePage from './pages/HomePage'
import AnalysisPage from './pages/AnalysisPage'
import RoadmapPage from './pages/RoadmapPage'

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-green-400' : 'bg-slate-500'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function App() {
  const [useAI, setUseAI] = useState(true)

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <header className="bg-indigo-700 text-white shadow-lg">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-indigo-700 font-black text-sm">SB</span>
              </div>
              <div>
                <span className="font-bold text-lg leading-tight block">SkillBridge</span>
                <span className="text-indigo-300 text-xs leading-tight block">Career Navigator</span>
              </div>
            </Link>

            {/* AI / Fallback toggle */}
            <div className="flex items-center gap-2.5">
              <span className={`text-sm transition-colors ${!useAI ? 'text-white font-medium' : 'text-indigo-300'}`}>
                Fallback
              </span>
              <ToggleSwitch checked={useAI} onChange={() => setUseAI(v => !v)} />
              <span className={`text-sm transition-colors ${useAI ? 'text-white font-medium' : 'text-indigo-300'}`}>
                AI Mode
              </span>
            </div>
          </div>
        </header>

        {/* Mode banner */}
        {!useAI && (
          <div className="bg-amber-50 border-b border-amber-200 text-center py-1.5 text-xs text-amber-700 font-medium">
            Fallback mode active — using rule-based keyword matching (no AI)
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage useAI={useAI} />} />
            <Route path="/analysis" element={<AnalysisPage useAI={useAI} />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
          </Routes>
        </main>

        <footer className="text-center text-slate-400 text-xs py-4 border-t border-slate-200">
          SkillBridge Career Navigator · Synthetic data only · No real PII
        </footer>
      </div>
    </BrowserRouter>
  )
}
