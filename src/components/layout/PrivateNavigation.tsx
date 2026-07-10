import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../auth/useAuth'

export function PrivateNavigation() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    const error = await signOut()
    if (error) {
      setSigningOut(false)
      return
    }
    navigate('/', { replace: true })
  }

  return <nav className="private-navigation" aria-label="Navegación de cuenta">
    <NavLink className={({ isActive }) => `private-nav-link${isActive ? ' is-active' : ''}`} to="/dashboard">Dashboard</NavLink>
    <NavLink className={({ isActive }) => `private-nav-link${isActive ? ' is-active' : ''}`} to="/calculator">Calculadora</NavLink>
    <button className="private-nav-signout" disabled={signingOut} onClick={() => void handleSignOut()} type="button">{signingOut ? 'Saliendo…' : 'Salir'}</button>
  </nav>
}
