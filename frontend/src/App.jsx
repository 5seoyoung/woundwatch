import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import History from './pages/History'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🩺</span>
          <span className="font-bold text-lg text-gray-900">WoundWatch</span>
        </div>
        <nav className="flex gap-6 text-sm font-medium">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
            }
          >
            Analyze
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
            }
          >
            History
          </NavLink>
        </nav>
        <div className="ml-auto text-xs text-gray-400">Powered by Gemma 4 · Runs locally via Ollama</div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <Routes>
          <Route path="/"        element={<Dashboard />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
    </div>
  )
}
