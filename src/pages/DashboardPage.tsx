import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { AppHeader } from '../components/layout/AppHeader'
import { PrivateNavigation } from '../components/layout/PrivateNavigation'
import { getExercises } from '../features/exercises/exercises.service'
import { exerciseCategoryLabels } from '../features/exercises/exercises.types'
import type { Exercise } from '../features/exercises/exercises.types'
import { getChartPoints, getDashboardSummary, getExerciseProgress, getPersonalRecordSummariesFromRecords, getRecentRecords } from '../features/dashboard/dashboard.service'
import { ProgressChart } from '../features/dashboard/ProgressChart'
import type { ExerciseProgress } from '../features/dashboard/dashboard.types'
import { PersonalRecordHistory } from '../features/personal-records/components/PersonalRecordHistory'
import { getPersonalRecords } from '../features/personal-records/personalRecords.service'
import type { PersonalRecord } from '../features/personal-records/personalRecords.types'
import { useQuickAddPersonalRecord } from '../features/personal-records/useQuickAddPersonalRecord'
import { supabase } from '../lib/supabase'

interface ProfileSummary { display_name: string | null; avatar_url: string | null }
const formatDate = (date: string): string => new Date(`${date}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
const formatWeight = (weight: number): string => weight.toLocaleString('es-AR', { maximumFractionDigits: 2 })
const byRecentOrder = (left: PersonalRecord, right: PersonalRecord): number => right.achievedAt.localeCompare(left.achievedAt) || right.createdAt.localeCompare(left.createdAt)

export function DashboardPage() {
  const { user } = useAuth()
  const { openQuickAddPersonalRecord } = useQuickAddPersonalRecord()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileSummary | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)

  const refreshRecords = useCallback(async () => {
    const [nextExercises, nextRecords] = await Promise.all([getExercises(), getPersonalRecords()])
    setExercises(nextExercises)
    setRecords(nextRecords)
    return { exercises: nextExercises, records: nextRecords }
  }, [])

  useEffect(() => {
    if (!user) return
    let active = true
    const loadDashboard = async () => {
      setLoading(true)
      setRecordsLoading(true)
      const [profileResponse, dashboardData] = await Promise.all([
        supabase.from('profiles').select('display_name, avatar_url').eq('id', user.id).maybeSingle(),
        Promise.all([getExercises(), getPersonalRecords()]),
      ])
      if (!active) return
      if (profileResponse.error) setMessage('No se pudieron cargar tus datos de cuenta. Revisá la conexión e intentá nuevamente.')
      else setProfile(profileResponse.data)
      setExercises(dashboardData[0])
      setRecords(dashboardData[1])
      setLoading(false)
      setRecordsLoading(false)
    }
    void loadDashboard().catch((error: unknown) => {
      if (!active) return
      setMessage(error instanceof Error ? `No se pudieron cargar tus PRs: ${error.message}` : 'No se pudieron cargar tus PRs.')
      setLoading(false)
      setRecordsLoading(false)
    })
    return () => { active = false }
  }, [user])

  useEffect(() => {
    const refreshAfterRecordChange = () => { void refreshRecords().catch(() => setMessage('No se pudo actualizar el dashboard.')) }
    window.addEventListener('personal-records-updated', refreshAfterRecordChange)
    return () => window.removeEventListener('personal-records-updated', refreshAfterRecordChange)
  }, [refreshRecords])

  const summaries = useMemo(() => getPersonalRecordSummariesFromRecords(exercises, records), [exercises, records])
  const dashboardSummary = useMemo(() => getDashboardSummary(exercises, records), [exercises, records])
  const recentRecords = useMemo(() => getRecentRecords(exercises, records), [exercises, records])
  const mainSummaries = useMemo(() => [...summaries].sort((left, right) => byRecentOrder(left.latestRecord, right.latestRecord)).slice(0, 6), [summaries])
  const progressByExercise = useMemo(() => summaries.flatMap((summary) => {
    const progress = getExerciseProgress(summary.exercise, records)
    return progress ? [progress] : []
  }), [records, summaries])
  const chartProgresses = useMemo(() => progressByExercise.filter((progress) => progress.records.length >= 2), [progressByExercise])
  const selectedSummary = summaries.find((summary) => summary.exercise.id === selectedExerciseId) ?? null
  const selectedProgress: ExerciseProgress | null = progressByExercise.find((progress) => progress.exercise.id === selectedExerciseId) ?? null
  const chartPoints = useMemo(() => getChartPoints(selectedProgress), [selectedProgress])
  const accountName = profile?.display_name || user?.email || 'Usuario'

  useEffect(() => {
    if (chartProgresses.some((progress) => progress.exercise.id === selectedExerciseId)) return
    setSelectedExerciseId(chartProgresses[0]?.exercise.id ?? summaries[0]?.exercise.id ?? null)
  }, [chartProgresses, selectedExerciseId, summaries])

  const handleHistoryChanged = async () => { await refreshRecords() }
  const openExercise = (exerciseId: string) => setSelectedExerciseId(exerciseId)
  const openNewRecord = (exerciseId = '') => openQuickAddPersonalRecord(exerciseId)

  return <main className="app-shell dashboard-page"><AppHeader /><PrivateNavigation /><section className="dashboard-hero dashboard-hero--compact"><div className="private-identity">{profile?.avatar_url ? <img alt="" className="account-avatar" src={profile.avatar_url} /> : <span aria-hidden="true" className="account-avatar account-avatar-fallback">{accountName.slice(0, 1).toUpperCase()}</span>}<div><span className="account-kicker">RESUMEN DE ENTRENAMIENTO</span><h1 className={accountName.includes('@') ? 'account-email-title' : ''}>Hola, {accountName}</h1></div></div><button className="add-pr-button" disabled={loading || exercises.length === 0} onClick={() => openNewRecord()} type="button">+ Agregar PR</button></section>{loading || recordsLoading ? <p className="account-status">Cargando tu dashboard…</p> : records.length === 0 ? <section className="dashboard-empty"><p className="eyebrow">EMPEZÁ ACÁ</p><h2>Todavía no registraste ningún PR.</h2><p>Agregá tu primera marca para ver tu evolución y tus métricas de entrenamiento.</p><button className="add-pr-button" disabled={exercises.length === 0} onClick={() => openNewRecord()} type="button">Agregar mi primer PR</button></section> : <><section aria-label="Métricas principales" className="dashboard-metrics"><article><span>Total de registros</span><strong>{dashboardSummary.totalRecords}</strong></article><article><span>Ejercicios con PR</span><strong>{dashboardSummary.exerciseCount}</strong></article><article><span>Último PR</span>{dashboardSummary.latestRecord ? <><strong>{formatWeight(dashboardSummary.latestRecord.record.weight)} <small>kg</small></strong><p>{dashboardSummary.latestRecord.exercise.name} · {formatDate(dashboardSummary.latestRecord.record.achievedAt)}</p></> : <p>Sin registros</p>}</article><article><span>Mejora más reciente</span>{dashboardSummary.latestImprovement ? <><strong>+{formatWeight(dashboardSummary.latestImprovement.difference)} <small>kg</small></strong><p>{dashboardSummary.latestImprovement.exercise.name} · {formatDate(dashboardSummary.latestImprovement.record.achievedAt)}</p></> : <p>Sin mejoras recientes</p>}</article></section><section className="dashboard-content-grid"><article className="dashboard-card dashboard-evolution"><div className="dashboard-card__heading"><div><p className="eyebrow">HISTORIAL</p><h2>Evolución</h2></div><label>Ejercicio<select aria-label="Ejercicio para el gráfico" disabled={chartProgresses.length === 0} onChange={(event) => setSelectedExerciseId(event.target.value)} value={chartProgresses.some((progress) => progress.exercise.id === selectedExerciseId) ? selectedExerciseId ?? '' : ''}><option value="">Elegí un ejercicio</option>{chartProgresses.map((progress) => <option key={progress.exercise.id} value={progress.exercise.id}>{progress.exercise.name}</option>)}</select></label></div><ProgressChart progress={selectedProgress && chartPoints.length >= 2 ? selectedProgress : null} />{selectedProgress && <div className="exercise-progress"><span><b>Primer registro</b>{formatWeight(selectedProgress.firstRecord.weight)} kg</span><span><b>Mejor registro</b>{formatWeight(selectedProgress.bestRecord.weight)} kg</span><span><b>Progreso total</b>{selectedProgress.totalProgress >= 0 ? '+' : ''}{formatWeight(selectedProgress.totalProgress)} kg</span><span><b>Registros</b>{selectedProgress.records.length}</span></div>}</article><article className="dashboard-card dashboard-top-prs"><div className="dashboard-card__heading"><div><p className="eyebrow">RENDIMIENTO</p><h2>Principales PRs</h2></div></div><div className="dashboard-list">{mainSummaries.map((summary) => <button aria-expanded={summary.exercise.id === selectedExerciseId} className={`dashboard-list__item${summary.exercise.id === selectedExerciseId ? ' is-active' : ''}`} key={summary.exercise.id} onClick={() => openExercise(summary.exercise.id)} type="button"><span><b>{summary.exercise.name}</b><small>{formatDate(summary.bestRecord.achievedAt)}</small></span><strong>{formatWeight(summary.bestRecord.weight)} <small>kg</small></strong></button>)}</div></article><article className="dashboard-card dashboard-recent"><div className="dashboard-card__heading"><div><p className="eyebrow">ÚLTIMOS REGISTROS</p><h2>Actividad reciente</h2></div></div><div className="dashboard-activity">{recentRecords.map(({ exercise, record }) => <article key={record.id}><div><b>{exercise.name}</b><span>{formatDate(record.achievedAt)}</span>{record.notes && <p>{record.notes}</p>}</div><strong>{formatWeight(record.weight)} <small>kg</small></strong></article>)}</div></article></section>{selectedSummary && <section className="dashboard-selected-detail" id={`pr-detail-${selectedSummary.exercise.id}`}><div className="dashboard-card__heading"><div><p className="eyebrow">{exerciseCategoryLabels[selectedSummary.exercise.category]}</p><h2>{selectedSummary.exercise.name}</h2></div><button className="detail-secondary" onClick={() => openNewRecord(selectedSummary.exercise.id)} type="button">Agregar nueva marca</button></div><div className="pr-detail-values"><div><span>Mejor PR</span><strong>{formatWeight(selectedSummary.bestRecord.weight)} kg</strong><small>{formatDate(selectedSummary.bestRecord.achievedAt)}</small></div><div><span>Último registro</span><strong>{formatWeight(selectedSummary.latestRecord.weight)} kg</strong><small>{formatDate(selectedSummary.latestRecord.achievedAt)}</small></div><div><span>Registros</span><strong>{selectedSummary.recordCount}</strong><small>en total</small></div></div><div className="pr-detail-actions"><button className="detail-primary" onClick={() => navigate({ pathname: '/calculator', search: `?exercise=${selectedSummary.exercise.id}` })} type="button">Usar en calculadora</button><button className="detail-secondary" onClick={() => openNewRecord(selectedSummary.exercise.id)} type="button">Agregar nueva marca</button></div><PersonalRecordHistory exercises={exercises} onChanged={handleHistoryChanged} summary={selectedSummary} /></section>}</>}{message && <p className="auth-message is-error" role="alert">{message}</p>}</main>
}
