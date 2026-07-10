import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { AppHeader } from '../components/layout/AppHeader'
import { PrivateNavigation } from '../components/layout/PrivateNavigation'
import { getExercises } from '../features/exercises/exercises.service'
import { exerciseCategoryLabels } from '../features/exercises/exercises.types'
import type { Exercise, ExerciseCategory } from '../features/exercises/exercises.types'
import { PersonalRecordModal } from '../features/personal-records/PersonalRecordModal'
import { getPersonalRecordSummaries } from '../features/personal-records/personalRecords.service'
import type { PersonalRecordSummary } from '../features/personal-records/personalRecords.types'
import { supabase } from '../lib/supabase'

interface ProfileSummary { display_name: string | null; avatar_url: string | null; default_bar_weight: number; rounding_mode: string }
const categoryOrder: ExerciseCategory[] = ['squat', 'snatch', 'clean', 'clean_and_jerk', 'jerk', 'strength', 'press', 'other']
const formatDate = (date: string): string => new Date(`${date}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
const formatWeight = (weight: number): string => weight.toLocaleString('es-AR', { maximumFractionDigits: 2 })

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileSummary | null>(null)
  const [plateCount, setPlateCount] = useState<number | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [summaries, setSummaries] = useState<PersonalRecordSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [modalExerciseId, setModalExerciseId] = useState<string | null>(null)
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)

  const refreshRecords = useCallback(async () => {
    const [nextExercises, nextSummaries] = await Promise.all([getExercises(), getPersonalRecordSummaries()])
    setExercises(nextExercises)
    setSummaries(nextSummaries)
  }, [])

  useEffect(() => {
    if (!user) return
    let active = true
    const loadDashboard = async () => {
      setLoading(true); setRecordsLoading(true)
      const [profileResponse, platesResponse, recordsResponse] = await Promise.all([
        supabase.from('profiles').select('display_name, avatar_url, default_bar_weight, rounding_mode').eq('id', user.id).maybeSingle(),
        supabase.from('user_plates').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        Promise.all([getExercises(), getPersonalRecordSummaries()]),
      ])
      if (!active) return
      if (profileResponse.error || platesResponse.error) setMessage('No se pudieron cargar tus datos de cuenta. Revisá la conexión e intentá nuevamente.')
      else { setProfile(profileResponse.data); setPlateCount(platesResponse.count ?? 0) }
      const [nextExercises, nextSummaries] = recordsResponse
      setExercises(nextExercises); setSummaries(nextSummaries); setLoading(false); setRecordsLoading(false)
    }
    void loadDashboard().catch((error: unknown) => { if (active) { setMessage(error instanceof Error ? `No se pudieron cargar tus PRs: ${error.message}` : 'No se pudieron cargar tus PRs.'); setLoading(false); setRecordsLoading(false) } })
    return () => { active = false }
  }, [user])

  const orderedSummaries = useMemo(() => [...summaries].sort((a, b) => categoryOrder.indexOf(a.exercise.category) - categoryOrder.indexOf(b.exercise.category) || a.exercise.sortOrder - b.exercise.sortOrder || a.exercise.name.localeCompare(b.exercise.name)), [summaries])
  const selectedSummary = orderedSummaries.find((summary) => summary.exercise.id === selectedExerciseId) ?? null
  const latestRecord = useMemo(() => summaries.map((summary) => summary.latestRecord).sort((a, b) => b.achievedAt.localeCompare(a.achievedAt) || b.createdAt.localeCompare(a.createdAt))[0], [summaries])
  const totalRecords = summaries.reduce((total, summary) => total + summary.recordCount, 0)
  const accountName = profile?.display_name || user?.email || 'Usuario'
  const handleSaved = async (_exerciseId: string) => { try { await refreshRecords(); setRecordsLoading(false); setSuccessMessage('PR guardado correctamente.') } catch (error) { setMessage(error instanceof Error ? `El PR se guardó, pero no se pudo actualizar la lista: ${error.message}` : 'El PR se guardó, pero no se pudo actualizar la lista.') } }
  const toggleDetail = (exerciseId: string) => setSelectedExerciseId((current) => current === exerciseId ? null : exerciseId)

  return <main className="app-shell dashboard-page"><AppHeader /><PrivateNavigation /><section className="dashboard-hero"><div className="private-identity">{profile?.avatar_url ? <img alt="" className="account-avatar" src={profile.avatar_url} /> : <span className="account-avatar account-avatar-fallback" aria-hidden="true">{accountName.slice(0, 1).toUpperCase()}</span>}<div><span className="account-kicker">Sesión activa</span><h1>Hola, {accountName}</h1></div></div><button className="add-pr-button" disabled={loading || exercises.length === 0} onClick={() => { setSuccessMessage(null); setModalExerciseId('') }} type="button">+ Agregar PR</button></section>{loading ? <p className="account-status">Cargando tu configuración…</p> : <div className="account-stats dashboard-stats"><span><b>{profile?.default_bar_weight ?? '—'}{profile ? ' kg' : ''}</b>barra</span><span><b>{profile?.rounding_mode === 'nearest' ? 'Cercano' : profile ? 'Abajo' : '—'}</b>ajuste</span><span><b>{plateCount ?? '—'}</b>discos</span></div>}<section className="pr-section"><div className="pr-section-heading"><div><p className="eyebrow">HISTORIAL</p><h2>Mis PRs</h2></div><div className="pr-summary"><span><b>{summaries.length}</b> ejercicios</span><span><b>{totalRecords}</b> marcas</span>{latestRecord && <span><b>{formatDate(latestRecord.achievedAt)}</b> última</span>}</div></div>{recordsLoading ? <p className="account-status">Cargando tus récords…</p> : orderedSummaries.length === 0 ? <div className="records-placeholder"><strong>Todavía no registraste ningún PR.</strong><p>Agregá tu primera marca para empezar a construir tu historial.</p></div> : <><div className="pr-button-grid">{orderedSummaries.map((summary) => <button aria-controls={`pr-detail-${summary.exercise.id}`} aria-expanded={summary.exercise.id === selectedExerciseId} className={`pr-exercise-button${summary.exercise.id === selectedExerciseId ? ' is-active' : ''}`} key={summary.exercise.id} onClick={() => toggleDetail(summary.exercise.id)} type="button"><span>{summary.exercise.name}</span><small>{formatWeight(summary.bestRecord.weight)} kg</small></button>)}</div>{selectedSummary && <article className="pr-detail" id={`pr-detail-${selectedSummary.exercise.id}`}><div><span className="pr-category">{exerciseCategoryLabels[selectedSummary.exercise.category]}</span><h3>{selectedSummary.exercise.name}</h3></div><div className="pr-detail-values"><div><span>Mejor PR</span><strong>{formatWeight(selectedSummary.bestRecord.weight)} kg</strong><small>{formatDate(selectedSummary.bestRecord.achievedAt)}</small></div><div><span>Último registro</span><strong>{formatWeight(selectedSummary.latestRecord.weight)} kg</strong><small>{formatDate(selectedSummary.latestRecord.achievedAt)}</small></div><div><span>Registros</span><strong>{selectedSummary.recordCount}</strong><small>en total</small></div></div><div className="pr-detail-actions"><button className="detail-primary" onClick={() => navigate({ pathname: '/calculator', search: `?exercise=${selectedSummary.exercise.id}` })} type="button">Usar en calculadora</button><button className="detail-secondary" onClick={() => setModalExerciseId(selectedSummary.exercise.id)} type="button">Agregar nueva marca</button></div></article>}</>}</section>{successMessage && <p className="auth-message" role="status">{successMessage}</p>}{message && <p className="auth-message is-error" role="alert">{message}</p>}{modalExerciseId !== null && <PersonalRecordModal exercises={exercises} initialExerciseId={modalExerciseId} key={modalExerciseId} onClose={() => setModalExerciseId(null)} onSaved={handleSaved} />}</main>
}
