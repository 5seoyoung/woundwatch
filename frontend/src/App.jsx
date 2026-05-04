import { Routes, Route, NavLink } from 'react-router-dom'
import TossEmoji from './components/TossEmoji'
import { usePatient } from './hooks/usePatient'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Profile from './pages/Profile'

const NAV = [
  { to: '/',         emoji: '🏠', label: 'Home' },
  { to: '/analyze',  emoji: '📷', label: 'Scan' },
  { to: '/tracking', emoji: '📊', label: 'Progress' },
  { to: '/profile',  emoji: '👤', label: 'Profile' },
]

export default function App() {
  const { patient, register, enterDemo, clear } = usePatient()

  if (!patient) {
    return <Onboarding onDemo={enterDemo} onComplete={register} />
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      maxWidth: 430,
      margin: '0 auto',
      background: 'var(--surface-dim)',
      boxShadow: '0 0 60px rgba(32,33,36,0.14)',
    }}>
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Routes>
          <Route path="/"         element={<Home patient={patient} />} />
          <Route path="/analyze"  element={<Dashboard patient={patient} />} />
          <Route path="/tracking" element={<History patient={patient} />} />
          <Route path="/profile"  element={<Profile patient={patient} onReset={clear} />} />
        </Routes>
      </main>

      <nav style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        padding: '8px 0 20px',
        flexShrink: 0,
      }}>
        {NAV.map(({ to, emoji, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 3, padding: '6px 4px',
              }}>
                <div style={{
                  width: 36, height: 26,
                  borderRadius: 99,
                  background: isActive ? 'var(--primary-soft)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}>
                  <TossEmoji emoji={emoji} size={isActive ? 20 : 18} />
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--primary)' : 'var(--on-surface-3)',
                  letterSpacing: '0.01em',
                }}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
