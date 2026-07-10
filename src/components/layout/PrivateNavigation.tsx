import { NavLink } from 'react-router-dom'

export function PrivateNavigation() {
  return <nav className="private-navigation" aria-label="Navegación de cuenta">
    <div className="private-nav-routes"><NavLink className={({ isActive }) => `private-nav-link${isActive ? ' is-active' : ''}`} to="/dashboard">Dashboard</NavLink>
    <NavLink className={({ isActive }) => `private-nav-link${isActive ? ' is-active' : ''}`} to="/calculator">Calculadora</NavLink>
    <NavLink className={({ isActive }) => `private-nav-link${isActive ? ' is-active' : ''}`} to="/account">Cuenta</NavLink></div>
  </nav>
}
