import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function ProtectedRoute() {
  const { loading, user } = useAuth()
  if (loading) return <main className="route-state">Cargando tu sesión…</main>
  return user ? <Outlet /> : <Navigate replace to="/login" />
}
