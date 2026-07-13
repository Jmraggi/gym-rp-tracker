import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { AppHeader } from '../components/layout/AppHeader'
import { supabase } from '../lib/supabase'

type AuthMode = 'sign-in' | 'sign-up'

const getSpanishAuthError = (message: string): string => {
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login')) return 'El email o la contraseña son incorrectos.'
  if (normalized.includes('already registered')) return 'Ya existe una cuenta con ese email.'
  if (normalized.includes('password')) return 'La contraseña debe tener al menos 6 caracteres.'
  return 'No se pudo completar la operación. Revisá tu conexión e intentá nuevamente.'
}

export function LoginPage() {
  const { loading, signIn, signInWithGoogle, signUp, user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (loading) return <main className="route-state">Cargando cuenta…</main>
  if (user) return <Navigate replace to="/dashboard" />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSubmitting(true)
    const error = mode === 'sign-in' ? await signIn(email, password) : await signUp(email, password)
    setSubmitting(false)
    if (error) {
      setErrorMessage(getSpanishAuthError(error.message))
      return
    }
    setPassword('')
    const { data } = await supabase.auth.getSession()
    if (data.session) navigate('/dashboard', { replace: true })
    else setErrorMessage('Revisá tu email para confirmar tu cuenta antes de iniciar sesión.')
  }

  const handleGoogleSignIn = async () => {
    setErrorMessage(null)
    setSubmitting(true)
    const error = await signInWithGoogle()

    if (error) {
      setErrorMessage(`No se pudo iniciar sesión con Google. ${getSpanishAuthError(error.message)}`)
      setSubmitting(false)
    }
  }

  return <main className="app-shell auth-page"><AppHeader backToWelcome /><section className="login-card"><p className="eyebrow">CUENTA</p><h1>Iniciar sesión</h1><p className="intro">Guardá tus ejercicios, récords y preferencias para retomarlos cuando quieras.</p><button className="google-button" disabled={submitting} onClick={() => void handleGoogleSignIn()} type="button"><span className="google-mark" aria-hidden="true">G</span>{submitting ? 'Conectando con Google…' : 'Continuar con Google'}</button><div className="login-divider"><span>o usá tu email</span></div><div className="auth-tabs"><button className={mode === 'sign-in' ? 'is-active' : ''} disabled={submitting} onClick={() => { setMode('sign-in'); setErrorMessage(null) }} type="button">Entrar</button><button className={mode === 'sign-up' ? 'is-active' : ''} disabled={submitting} onClick={() => { setMode('sign-up'); setErrorMessage(null) }} type="button">Crear cuenta</button></div><form className="auth-form login-form" onSubmit={(event) => void handleSubmit(event)}><label>Email<input autoComplete="email" disabled={submitting} onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label><label>Contraseña<input autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} disabled={submitting} minLength={6} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label><button className="auth-submit" disabled={submitting} type="submit">{submitting ? 'Procesando…' : mode === 'sign-in' ? 'Iniciar sesión' : 'Crear cuenta'}</button></form>{errorMessage && <p className="auth-message is-error" role="alert">{errorMessage}</p>}</section></main>
}
