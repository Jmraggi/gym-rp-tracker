import { useCallback, useEffect, useRef, useState } from 'react'
import { getExercises } from '../../exercises/exercises.service'
import type { Exercise } from '../../exercises/exercises.types'
import { PersonalRecordModal } from '../../personal-records/PersonalRecordModal'
import { getExercisesWithPersonalRecords } from '../../personal-records/personalRecords.service'
import type { PersonalRecordSummary } from '../../personal-records/personalRecords.types'

export type CalculatorSourceMode = 'saved' | 'manual'
interface AuthenticatedCalculatorSourceProps { mode: CalculatorSourceMode; initialExerciseId?: string | null; onModeChange: (mode: CalculatorSourceMode) => void; onWeightChange: (weight: string) => void }
const formatWeight = (weight: number): string => weight.toLocaleString('es-AR', { maximumFractionDigits: 2 })

export function AuthenticatedCalculatorSource({ mode, initialExerciseId, onModeChange, onWeightChange }: AuthenticatedCalculatorSourceProps) {
  const [summaries, setSummaries] = useState<PersonalRecordSummary[]>([])
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [modalExerciseId, setModalExerciseId] = useState<string | null>(null)
  const initialExerciseApplied = useRef(false)
  const refresh = useCallback(async (): Promise<PersonalRecordSummary[]> => { const [nextSummaries, nextExercises] = await Promise.all([getExercisesWithPersonalRecords(), getExercises()]); const sorted = nextSummaries.sort((a, b) => a.exercise.name.localeCompare(b.exercise.name)); setSummaries(sorted); setAllExercises(nextExercises); return sorted }, [])

  const selectExercise = useCallback((exerciseId: string, source = summaries) => { setSelectedExerciseId(exerciseId); const summary = source.find((item) => item.exercise.id === exerciseId); onWeightChange(summary ? String(summary.bestRecord.weight) : '') }, [onWeightChange, summaries])
  useEffect(() => { let active = true; void refresh().catch(() => { if (active) setMessage('No se pudieron cargar tus PRs.') }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [refresh])
  useEffect(() => { if (initialExerciseApplied.current || !initialExerciseId || summaries.length === 0) return; if (summaries.some((summary) => summary.exercise.id === initialExerciseId)) { initialExerciseApplied.current = true; selectExercise(initialExerciseId) } }, [initialExerciseId, selectExercise, summaries])
  useEffect(() => { const onRecordsChanged = () => { void refresh().then((next) => { if (selectedExerciseId && next.some((summary) => summary.exercise.id === selectedExerciseId)) selectExercise(selectedExerciseId, next); else if (selectedExerciseId) selectExercise('') }) }; window.addEventListener('personal-records-updated', onRecordsChanged); return () => window.removeEventListener('personal-records-updated', onRecordsChanged) }, [refresh, selectExercise, selectedExerciseId])

  const selectedSummary = summaries.find((summary) => summary.exercise.id === selectedExerciseId) ?? null
  const handleModeChange = (nextMode: CalculatorSourceMode) => { onModeChange(nextMode); if (nextMode === 'manual') onWeightChange(''); else if (selectedSummary) onWeightChange(String(selectedSummary.bestRecord.weight)) }
  const handleRecordSaved = async (exerciseId: string) => { const next = await refresh(); selectExercise(exerciseId, next) }

  return <section aria-label="Origen del peso" className="calculator-source calculator-source--compact"><div className="source-tabs"><button aria-pressed={mode === 'saved'} className={mode === 'saved' ? 'is-active' : ''} onClick={() => handleModeChange('saved')} type="button">Mis PRs</button><button aria-pressed={mode === 'manual'} className={mode === 'manual' ? 'is-active' : ''} onClick={() => handleModeChange('manual')} type="button">Manual</button></div>{mode === 'saved' && <div className="saved-source">{loading ? <p>Cargando PRs…</p> : summaries.length === 0 ? <div className="source-empty"><p>Sin PRs todavía.</p><button onClick={() => setModalExerciseId('')} type="button">Agregar PR</button></div> : <><label>Seleccionar PR<select onChange={(event) => selectExercise(event.target.value)} value={selectedExerciseId}><option value="">Elegí un ejercicio</option>{summaries.map((summary) => <option key={summary.exercise.id} value={summary.exercise.id}>{summary.exercise.name} · {formatWeight(summary.bestRecord.weight)} kg</option>)}</select></label>{selectedSummary && <div className="selected-pr selected-pr--compact"><span>{selectedSummary.exercise.name}</span><strong>{formatWeight(selectedSummary.bestRecord.weight)} <small>kg</small></strong><button aria-label={`Agregar marca para ${selectedSummary.exercise.name}`} onClick={() => setModalExerciseId(selectedSummary.exercise.id)} type="button">+</button></div>}</>}</div>}{message && <p className="auth-message is-error" role="alert">{message}</p>}{modalExerciseId !== null && <PersonalRecordModal exercises={allExercises} initialExerciseId={modalExerciseId} key={modalExerciseId} onClose={() => setModalExerciseId(null)} onSaved={handleRecordSaved} />}</section>
}
