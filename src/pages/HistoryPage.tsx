import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppHeader } from '../components/layout/AppHeader'
import { PrivateNavigation } from '../components/layout/PrivateNavigation'
import { getWorkoutCount, getWorkoutDatesPage, removeWorkout } from '../features/dashboard/workoutSessions.service'
import { getExercises } from '../features/exercises/exercises.service'
import type { Exercise } from '../features/exercises/exercises.types'
import { PersonalRecordModal } from '../features/personal-records/PersonalRecordModal'
import {
  deletePersonalRecord,
  getPersonalRecordCount,
  getPersonalRecordExerciseIds,
  getPersonalRecordsPage,
  notifyPersonalRecordsChanged,
} from '../features/personal-records/personalRecords.service'
import type { PersonalRecord } from '../features/personal-records/personalRecords.types'

type HistoryTab = 'prs' | 'workouts'
const PAGE_SIZE = 20
const formatDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
const formatMonth = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
const formatWeight = (weight: number) => weight.toLocaleString('es-AR', { maximumFractionDigits: 2 })
const groupByMonth = <T,>(items: T[], dateOf: (item: T) => string): Array<[string, T[]]> => {
  const groups = new Map<string, T[]>()
  items.forEach((item) => {
    const key = formatMonth(dateOf(item))
    groups.set(key, [...(groups.get(key) ?? []), item])
  })
  return [...groups.entries()]
}

export function HistoryPage() {
  const [tab, setTab] = useState<HistoryTab>('prs')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filterExerciseId, setFilterExerciseId] = useState('')
  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [workouts, setWorkouts] = useState<string[]>([])
  const [recordCount, setRecordCount] = useState(0)
  const [workoutCount, setWorkoutCount] = useState(0)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [editing, setEditing] = useState<PersonalRecord | null>(null)
  const [deleting, setDeleting] = useState<PersonalRecord | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const exerciseNames = useMemo(() => new Map(exercises.map((exercise) => [exercise.id, exercise.name])), [exercises])

  const loadRecords = useCallback(async (offset = 0, append = false) => {
    const result = await getPersonalRecordsPage({ exerciseId: filterExerciseId || undefined, offset, limit: PAGE_SIZE })
    setRecords((current) => append ? [...current, ...result.records] : result.records)
    setHasMore(result.hasMore)
  }, [filterExerciseId])
  const loadWorkouts = useCallback(async (offset = 0, append = false) => {
    const result = await getWorkoutDatesPage({ offset, limit: PAGE_SIZE })
    setWorkouts((current) => append ? [...current, ...result.dates] : result.dates)
    setHasMore(result.hasMore)
  }, [])
  const refreshCounts = useCallback(async () => {
    const [nextExercises, exerciseIdsWithRecords, nextRecordCount, nextWorkoutCount] = await Promise.all([
      getExercises(), getPersonalRecordExerciseIds(), getPersonalRecordCount(), getWorkoutCount(),
    ])
    setExercises(nextExercises.filter((exercise) => exerciseIdsWithRecords.has(exercise.id)))
    setRecordCount(nextRecordCount)
    setWorkoutCount(nextWorkoutCount)
  }, [])

  useEffect(() => { void refreshCounts().catch(() => setMessage('No se pudo cargar el historial.')) }, [refreshCounts])
  useEffect(() => {
    setLoading(true)
    const load = tab === 'prs' ? loadRecords(page * PAGE_SIZE) : loadWorkouts(page * PAGE_SIZE)
    void load.catch(() => setMessage('No se pudo cargar el historial.')).finally(() => setLoading(false))
  }, [loadRecords, loadWorkouts, page, tab])

  const changeTab = (nextTab: HistoryTab) => { setPage(0); setTab(nextTab) }
  const changeFilter = (exerciseId: string) => { setPage(0); setFilterExerciseId(exerciseId) }
  const refreshCurrent = async () => {
    await refreshCounts()
    if (tab === 'prs') await loadRecords(page * PAGE_SIZE)
    else await loadWorkouts(page * PAGE_SIZE)
  }
  const removeRecord = async () => {
    if (!deleting) return
    try { await deletePersonalRecord(deleting.id); notifyPersonalRecordsChanged(); setDeleting(null); await refreshCurrent() }
    catch { setMessage('No se pudo eliminar el PR.') }
  }
  const removeTraining = async (date: string) => {
    try { await removeWorkout(date); await refreshCurrent() }
    catch { setMessage('No se pudo eliminar el entreno.') }
  }
  const loadMore = async () => {
    setLoadingMore(true)
    try {
      if (tab === 'prs') await loadRecords(records.length, true)
      else await loadWorkouts(workouts.length, true)
    } catch { setMessage('No se pudo cargar más historial.') }
    finally { setLoadingMore(false) }
  }

  const recordGroups = useMemo(() => groupByMonth(records, (record) => record.achievedAt), [records])
  const workoutGroups = useMemo(() => groupByMonth(workouts, (date) => date), [workouts])

  return <main className="app-shell app-shell--private history-page">
    <AppHeader/><PrivateNavigation/>
    <header className="history-page__hero"><p className="eyebrow">REGISTROS</p><h1>Historial</h1></header>
    <section className="history-panel">
      <div className="history-tabs">
        <button aria-pressed={tab === 'prs'} className={tab === 'prs' ? 'is-active' : ''} onClick={() => changeTab('prs')} type="button">PRs <span>{recordCount}</span></button>
        <button aria-pressed={tab === 'workouts'} className={tab === 'workouts' ? 'is-active' : ''} onClick={() => changeTab('workouts')} type="button">Entrenos <span>{workoutCount}</span></button>
      </div>
      {tab === 'prs' && <label className="history-filter">Ejercicio<select onChange={(event) => changeFilter(event.target.value)} value={filterExerciseId}><option value="">Todos los ejercicios</option>{exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select></label>}
      {loading ? <p className="account-status">Cargando…</p> : tab === 'prs'
        ? <div className="history-list">{recordGroups.length ? recordGroups.map(([month, entries]) => <details className="history-month" key={month} open><summary>{month}</summary>{entries.map((record) => <article className="history-row" key={record.id}><div><strong>{exerciseNames.get(record.exerciseId) ?? 'Ejercicio'}</strong><span>{formatDate(record.achievedAt)}{record.notes ? ` · ${record.notes}` : ''}</span></div><b>{formatWeight(record.weight)} <small>kg</small></b><div className="history-row__actions"><button onClick={() => setEditing(record)} type="button">Editar</button><button className="is-danger" onClick={() => setDeleting(record)} type="button">Eliminar</button></div></article>)}</details>) : <p className="account-status">Todavía no hay PRs.</p>}</div>
        : <div className="history-list">{workoutGroups.length ? workoutGroups.map(([month, entries]) => <details className="history-month" key={month} open><summary>{month}</summary>{entries.map((date) => <article className="history-row history-row--workout" key={date}><div><strong>Entreno</strong><span>{formatDate(date)}</span></div><span aria-hidden="true" className="history-row__check">✓</span><div className="history-row__actions"><button className="is-danger" onClick={() => void removeTraining(date)} type="button">Eliminar</button></div></article>)}</details>) : <p className="account-status">Todavía no hay entrenos marcados.</p>}</div>}
      <nav aria-label="Paginación del historial" className="history-pagination">
        <button disabled={loading || page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} type="button">← Anterior</button>
        <span><small>PÁGINA</small>{page + 1}</span>
        <button disabled={loading || !hasMore} onClick={() => setPage((current) => current + 1)} type="button">Siguiente →</button>
      </nav>
      {hasMore && <button className="history-load-more" disabled={loadingMore} onClick={() => void loadMore()} type="button">{loadingMore ? 'Cargando…' : 'Cargar más'}</button>}
    </section>
    {message && <p className="auth-message is-error" role="alert">{message}</p>}
    {editing && <PersonalRecordModal exercises={exercises} initialExerciseId={editing.exerciseId} key={editing.id} onClose={() => setEditing(null)} onSaved={refreshCurrent} recordToEdit={editing}/>} 
    {deleting && <div aria-modal="true" className="pr-modal-backdrop" role="dialog"><section className="delete-dialog"><h3>Eliminar PR</h3><p>¿Eliminar {formatWeight(deleting.weight)} kg de {exerciseNames.get(deleting.exerciseId) ?? 'este ejercicio'}?</p><div><button onClick={() => setDeleting(null)} type="button">Cancelar</button><button className="is-danger" onClick={() => void removeRecord()} type="button">Eliminar</button></div></section></div>}
  </main>
}
