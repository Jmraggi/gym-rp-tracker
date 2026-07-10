import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getExercises } from '../../exercises/exercises.service'
import type { Exercise } from '../../exercises/exercises.types'
import { PersonalRecordModal } from '../../personal-records/PersonalRecordModal'
import { getExercisesWithPersonalRecords } from '../../personal-records/personalRecords.service'
import type { PersonalRecordSummary } from '../../personal-records/personalRecords.types'

export type CalculatorSourceMode = 'saved' | 'manual'

interface AuthenticatedCalculatorSourceProps {
  mode: CalculatorSourceMode
  initialExerciseId?: string | null
  onModeChange: (mode: CalculatorSourceMode) => void
  onWeightChange: (weight: string) => void
}

const normalize = (value: string): string => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-AR')
const formatWeight = (weight: number): string => weight.toLocaleString('es-AR', { maximumFractionDigits: 2 })
const formatDate = (date: string): string => new Date(`${date}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

export function AuthenticatedCalculatorSource({ mode, initialExerciseId, onModeChange, onWeightChange }: AuthenticatedCalculatorSourceProps) {
  const [summaries, setSummaries] = useState<PersonalRecordSummary[]>([])
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [modalExerciseId, setModalExerciseId] = useState<string | null>(null)
  const initialExerciseApplied = useRef(false)

  const refresh = useCallback(async (): Promise<PersonalRecordSummary[]> => {
    const [nextSummaries, nextExercises] = await Promise.all([getExercisesWithPersonalRecords(), getExercises()])
    setSummaries(nextSummaries.sort((a, b) => a.exercise.name.localeCompare(b.exercise.name)))
    setAllExercises(nextExercises)
    return nextSummaries
  }, [])

  useEffect(() => {
    let active = true
    void refresh().catch((error: unknown) => {
      if (active) setMessage(error instanceof Error ? `No se pudieron cargar tus PRs: ${error.message}` : 'No se pudieron cargar tus PRs.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [refresh])

  const selectedSummary = summaries.find((summary) => summary.exercise.id === selectedExerciseId) ?? null
  const filteredSummaries = useMemo(() => summaries.filter((summary) => normalize(summary.exercise.name).includes(normalize(search))), [search, summaries])

  const selectExercise = (summary: PersonalRecordSummary) => {
    setSelectedExerciseId(summary.exercise.id)
    setSearch(summary.exercise.name)
    onWeightChange(String(summary.bestRecord.weight))
  }

  useEffect(() => {
    if (initialExerciseApplied.current || !initialExerciseId || summaries.length === 0) return
    const summary = summaries.find((item) => item.exercise.id === initialExerciseId)
    if (summary) {
      initialExerciseApplied.current = true
      setSelectedExerciseId(summary.exercise.id)
      setSearch(summary.exercise.name)
      onWeightChange(String(summary.bestRecord.weight))
    }
  }, [initialExerciseId, onWeightChange, summaries])

  const handleSearch = (value: string) => {
    setSearch(value)
    const selected = summaries.find((summary) => summary.exercise.id === selectedExerciseId)
    if (!selected || normalize(value) !== normalize(selected.exercise.name)) {
      setSelectedExerciseId('')
      onWeightChange('')
    }
  }

  const handleModeChange = (nextMode: CalculatorSourceMode) => {
    onModeChange(nextMode)
    if (nextMode === 'manual') onWeightChange('')
    else if (selectedSummary) onWeightChange(String(selectedSummary.bestRecord.weight))
  }

  const handleRecordSaved = async (exerciseId: string) => {
    const nextSummaries = await refresh()
    const refreshed = nextSummaries.find((summary) => summary.exercise.id === exerciseId)
    if (refreshed) {
      setSelectedExerciseId(refreshed.exercise.id)
      setSearch(refreshed.exercise.name)
      onWeightChange(String(refreshed.bestRecord.weight))
    }
  }

  return <section className="calculator-source" aria-label="Origen del peso"><div className="source-tabs"><button aria-pressed={mode === 'saved'} className={mode === 'saved' ? 'is-active' : ''} onClick={() => handleModeChange('saved')} type="button">Usar mis PRs</button><button aria-pressed={mode === 'manual'} className={mode === 'manual' ? 'is-active' : ''} onClick={() => handleModeChange('manual')} type="button">Ingresar peso manual</button></div>{mode === 'saved' && <div className="saved-source">{loading ? <p>Cargando tus PRs…</p> : summaries.length === 0 ? <div className="source-empty"><p>No tenés PRs registrados todavía.</p><button onClick={() => setModalExerciseId('')} type="button">Agregar mi primer PR</button></div> : <><label>Ejercicio<input aria-controls="saved-exercise-options" autoComplete="off" onChange={(event) => handleSearch(event.target.value)} placeholder="Buscá un ejercicio" type="search" value={search} /></label><div className="source-exercise-options" id="saved-exercise-options">{filteredSummaries.map((summary) => <button className={summary.exercise.id === selectedExerciseId ? 'is-selected' : ''} key={summary.exercise.id} onClick={() => selectExercise(summary)} type="button">{summary.exercise.name}</button>)}</div>{search.trim() !== '' && filteredSummaries.length === 0 && <p className="exercise-empty">No encontramos ese ejercicio.</p>}{selectedSummary && <article className="selected-pr"><div><span>{selectedSummary.exercise.name}</span><strong>{formatWeight(selectedSummary.bestRecord.weight)} kg</strong><small>Mejor PR · {formatDate(selectedSummary.bestRecord.achievedAt)}</small></div><div className="selected-pr-meta"><span>{selectedSummary.recordCount} {selectedSummary.recordCount === 1 ? 'registro' : 'registros'}</span>{selectedSummary.latestRecord.id !== selectedSummary.bestRecord.id && <span>Último: {formatWeight(selectedSummary.latestRecord.weight)} kg · {formatDate(selectedSummary.latestRecord.achievedAt)}</span>}<button onClick={() => setModalExerciseId(selectedSummary.exercise.id)} type="button">Agregar nueva marca</button></div></article>}</>}</div>}{message && <p className="auth-message is-error" role="alert">{message}</p>}{modalExerciseId !== null && <PersonalRecordModal exercises={allExercises} initialExerciseId={modalExerciseId} key={modalExerciseId} onClose={() => setModalExerciseId(null)} onSaved={handleRecordSaved} />}</section>
}
