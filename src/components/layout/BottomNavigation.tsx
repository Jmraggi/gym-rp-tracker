import { NavLink } from 'react-router-dom'

function DashboardIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></svg>
}

function CalculatorIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><rect height="19" rx="2" width="14" x="5" y="2" /><path d="M8 6h8M8 11h2m4 0h2m-8 4h2m4 0h2" /></svg>
}

function AccountIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></svg>
}

const navigationItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Calculadora', path: '/calculator', icon: <CalculatorIcon /> },
  { label: 'Cuenta', path: '/account', icon: <AccountIcon /> },
]

export function BottomNavigation() {
  return <nav aria-label="Navegación principal" className="bottom-navigation">
    {navigationItems.map((item) => <NavLink aria-label={item.label} className={({ isActive }) => `bottom-navigation__link${isActive ? ' is-active' : ''}`} key={item.path} to={item.path}>
      {item.icon}
      <span>{item.label}</span>
    </NavLink>)}
  </nav>
}
