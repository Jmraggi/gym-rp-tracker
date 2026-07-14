import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { AppHeader } from '../components/layout/AppHeader'

export function WelcomePage() {
  const { loading, user } = useAuth()
  if (!loading && user) return <Navigate replace to="/dashboard" />
  if (loading) return <main className="route-state">Preparando Gym PR Tracker…</main>

  return <main className="app-shell welcome-page"><AppHeader hideAction /><section className="welcome-card"><div className="welcome-mark" aria-hidden="true">PR</div><p className="eyebrow">GYM PR TRACKER</p><h1>Entrená con números claros.</h1><p>Calculá tus porcentajes y guardá el historial de tus récords personales.</p><div className="welcome-actions">{user ? <Link className="welcome-primary" to="/dashboard">Ir a mi dashboard</Link> : <Link className="welcome-primary" to="/login">Iniciar sesión</Link>}<Link className="welcome-secondary" to="/calculator">Continuar sin iniciar sesión</Link></div></section></main>
}
