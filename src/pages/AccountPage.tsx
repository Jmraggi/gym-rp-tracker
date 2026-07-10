import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { AppHeader } from '../components/layout/AppHeader'
import { PrivateNavigation } from '../components/layout/PrivateNavigation'
import { supabase } from '../lib/supabase'

interface ProfileSummary {
  display_name: string | null
  avatar_url: string | null
  default_bar_weight: number
  rounding_mode: string
}

export function AccountPage() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileSummary | null>(null)
  const [plateCount, setPlateCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    const loadAccount = async () => {
      setLoading(true)
      const [profileResponse, platesResponse] = await Promise.all([
        supabase.from('profiles').select('display_name, avatar_url, default_bar_weight, rounding_mode').eq('id', user.id).maybeSingle(),
        supabase.from('user_plates').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ])
      if (!active) return
      if (profileResponse.error || platesResponse.error) setMessage('No se pudieron cargar tus datos de cuenta. Revisá la conexión e intentá nuevamente.')
      else { setProfile(profileResponse.data); setPlateCount(platesResponse.count ?? 0) }
      setLoading(false)
    }
    void loadAccount().catch(() => { if (active) { setMessage('No se pudieron cargar tus datos de cuenta.'); setLoading(false) } })
    return () => { active = false }
  }, [user])

  const accountName = profile?.display_name || user?.email || 'Usuario'
  const handleSignOut = async () => {
    setSigningOut(true)
    const error = await signOut()
    if (error) { setMessage('No se pudo cerrar la sesión. Intentá nuevamente.'); setSigningOut(false); return }
    navigate('/', { replace: true })
  }

  return <main className="app-shell app-shell--private account-page"><AppHeader /><PrivateNavigation /><section className="account-page__hero"><div className="private-identity">{profile?.avatar_url ? <img alt="" className="account-avatar account-page__avatar" src={profile.avatar_url} /> : <span aria-hidden="true" className="account-avatar account-avatar-fallback account-page__avatar">{accountName.slice(0, 1).toUpperCase()}</span>}<div><p className="eyebrow">MI CUENTA</p><h1 className={accountName.includes('@') ? 'account-email-title' : ''}>{accountName}</h1><p>Sesión activa</p></div></div></section>{loading ? <p className="account-status">Cargando tu configuración…</p> : <section aria-label="Preferencias de cuenta" className="account-page__details"><h2>Preferencias</h2><div className="account-stats account-page__stats"><span><b>{profile?.default_bar_weight ?? '—'}{profile ? ' kg' : ''}</b>barra predeterminada</span><span><b>{profile?.rounding_mode === 'nearest' ? 'Cercano' : profile ? 'Hacia abajo' : '—'}</b>modo de ajuste</span><span><b>{plateCount ?? '—'}</b>discos configurados</span></div></section>}{message && <p className="auth-message is-error" role="alert">{message}</p>}<div className="account-page__actions"><button className="account-page__signout" disabled={signingOut} onClick={() => void handleSignOut()} type="button">{signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</button><Link className="account-page__home" to="/">Volver al inicio</Link></div></main>
}
