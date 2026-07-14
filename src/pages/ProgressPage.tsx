import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { PrivateNavigation } from '../components/layout/PrivateNavigation'
import { getExercises } from '../features/exercises/exercises.service'
import type { Exercise } from '../features/exercises/exercises.types'
import { getPersonalRecords } from '../features/personal-records/personalRecords.service'
import type { PersonalRecord } from '../features/personal-records/personalRecords.types'
import { ExerciseProgressChart } from '../features/progress/components/ExerciseProgressChart'
import { ExerciseProgressSummary } from '../features/progress/components/ExerciseProgressSummary'
import { ExerciseRecordHistory } from '../features/progress/components/ExerciseRecordHistory'
import { ExerciseSelector } from '../features/progress/components/ExerciseSelector'
import { getExerciseProgressMetrics } from '../features/progress/progress.metrics'

const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : 'No se pudo cargar el progreso.'

export function ProgressPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadProgress = useCallback(async () => {
    setLoading(true); setLoadError(null)
    try { const [nextExercises, nextRecords] = await Promise.all([getExercises(), getPersonalRecords()]); setExercises(nextExercises); setRecords(nextRecords) }
    catch (error) { setLoadError(getErrorMessage(error)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void loadProgress() }, [loadProgress])
  useEffect(() => { const refresh = () => { void loadProgress() }; window.addEventListener('personal-records-updated', refresh); return () => window.removeEventListener('personal-records-updated', refresh) }, [loadProgress])

  const exerciseParam = searchParams.get('exercise')
  const sortedExercises = useMemo(() => [...exercises].sort((left, right) => left.name.localeCompare(right.name, 'es-AR') || left.id.localeCompare(right.id)), [exercises])
  const selectedExerciseId = useMemo(() => {
    if (exerciseParam && sortedExercises.some((exercise) => exercise.id === exerciseParam)) return exerciseParam
    const exerciseIdsWithRecords = new Set(records.map((record) => record.exerciseId))
    return sortedExercises.find((exercise) => exerciseIdsWithRecords.has(exercise.id))?.id ?? sortedExercises[0]?.id ?? ''
  }, [exerciseParam, records, sortedExercises])

  useEffect(() => {
    if (loading) return
    if (selectedExerciseId && exerciseParam !== selectedExerciseId) { const next = new URLSearchParams(searchParams); next.set('exercise', selectedExerciseId); setSearchParams(next, { replace: true }) }
    else if (!selectedExerciseId && exerciseParam !== null) { const next = new URLSearchParams(searchParams); next.delete('exercise'); setSearchParams(next, { replace: true }) }
  }, [exerciseParam, loading, searchParams, selectedExerciseId, setSearchParams])

  const selectedExercise = sortedExercises.find((exercise) => exercise.id === selectedExerciseId) ?? null
  const selectedRecords = useMemo(() => records.filter((record) => record.exerciseId === selectedExerciseId), [records, selectedExerciseId])
  const metrics = useMemo(() => getExerciseProgressMetrics(selectedRecords), [selectedRecords])
  const selectExercise = (exerciseId: string) => { if (exerciseId === exerciseParam) return; const next = new URLSearchParams(searchParams); next.set('exercise', exerciseId); setSearchParams(next, { replace: true }) }

  return <main aria-busy={loading} className="app-shell app-shell--private progress-page"><AppHeader/><PrivateNavigation/><header className="progress-page__hero"><p className="eyebrow">TU EVOLUCIÓN</p><h1>Progreso</h1><p>Seguí cada marca, cada mejora y cada paso hacia tu próximo PR.</p></header>{loading ? <section aria-label="Cargando progreso" className="progress-loading" role="status"><span className="sr-only">Cargando progreso…</span><div/><div/><div/></section> : loadError ? <div className="progress-error" role="alert"><span>{loadError}</span><button onClick={() => void loadProgress()} type="button">Reintentar</button></div> : !sortedExercises.length ? <section className="progress-empty"><h2>No hay ejercicios disponibles</h2><p>Cuando exista un ejercicio en tu catálogo, vas a poder ver su evolución acá.</p></section> : selectedExercise && <div className="progress-layout"><ExerciseSelector exercises={sortedExercises} onSelect={selectExercise} selectedExerciseId={selectedExerciseId}/><div className="progress-content">{metrics.excludedRecords > 0 && <p className="progress-data-warning" role="status">{metrics.excludedRecords} {metrics.excludedRecords === 1 ? 'registro no participó' : 'registros no participaron'} de las métricas ni del gráfico porque su fecha o peso no es válido.</p>}<ExerciseProgressSummary exercise={selectedExercise} metrics={metrics}/><ExerciseProgressChart exercise={selectedExercise} key={selectedExercise.id} metrics={metrics}/><ExerciseRecordHistory exercise={selectedExercise} metrics={metrics} records={selectedRecords}/></div></div>}</main>
}
