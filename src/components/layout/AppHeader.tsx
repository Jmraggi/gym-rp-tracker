import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

interface AppHeaderProps { backToWelcome?: boolean; hideAction?: boolean }

export function AppHeader({ backToWelcome = false, hideAction = false }: AppHeaderProps) {
  const { loading, user } = useAuth()

  return <header className="topbar">
    <Link className="brand" to="/">GYM PR</Link>
    <nav aria-label="Navegación principal">
      {backToWelcome ? <Link className="header-link" to="/">Volver al inicio</Link> : !hideAction && !loading && !user && <Link className="header-link" to="/login">Iniciar sesión</Link>}
    </nav>
  </header>
}
