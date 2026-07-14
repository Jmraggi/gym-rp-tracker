import { NavLink } from 'react-router-dom'

export function PrivateNavigation() {
  return <nav className="private-navigation" aria-label="Navegación de cuenta">
    <div className="private-navigation__brand" aria-hidden="true"><span>PR</span><div><strong>GYM</strong><small>TRACKER</small></div></div>
    <p className="private-navigation__label">MENÚ PRINCIPAL</p>
    <div className="private-nav-routes"><NavLink className={({ isActive }) => `private-nav-link${isActive ? ' is-active' : ''}`} to="/dashboard"><span aria-hidden="true">01</span>Dashboard</NavLink>
    <NavLink className={({ isActive }) => `private-nav-link${isActive ? ' is-active' : ''}`} to="/progreso"><span aria-hidden="true">02</span>Progreso</NavLink><NavLink className={({ isActive }) => `private-nav-link${isActive ? ' is-active' : ''}`} to="/calculator"><span aria-hidden="true">03</span>Calculadora</NavLink><NavLink className={({ isActive }) => `private-nav-link${isActive ? ' is-active' : ''}`} to="/history"><span aria-hidden="true">04</span>Historial</NavLink>
    <NavLink className={({ isActive }) => `private-nav-link${isActive ? ' is-active' : ''}`} to="/account"><span aria-hidden="true">05</span>Cuenta</NavLink></div>
    <p className="private-navigation__hint">Entrená. Registrá. Superate.</p>
  </nav>
}
