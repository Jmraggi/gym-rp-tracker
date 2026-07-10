import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Exercise } from '../exercises/exercises.types'
import { createPersonalRecord } from './personalRecords.service'

interface PersonalRecordModalProps { exercises: Exercise[]; initialExerciseId?: string; onClose: () => void; onSaved: (exerciseId: string) => Promise<void> }

const today = (): string => new Date().toISOString().slice(0, 10)
const normalize = (value: string): string => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-AR')
const isValidDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime())

export function PersonalRecordModal({ exercises, initialExerciseId = '', onClose, onSaved }: PersonalRecordModalProps) {
  const initialExercise = exercises.find((exercise) => exercise.id === initialExerciseId)
  const [exerciseId, setExerciseId] = useState(initialExerciseId)
  const [search, setSearch] = useState(initialExercise?.name ?? '')
  const [weight, setWeight] = useState('')
  const [achievedAt, setAchievedAt] = useState(today)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const parsedWeight = Number(weight.replace(',', '.'))
  const validWeight = Number.isFinite(parsedWeight) && parsedWeight > 0
  const filteredExercises = useMemo(() => [...exercises].sort((a, b) => a.name.localeCompare(b.name)).filter((exercise) => normalize(exercise.name).includes(normalize(search))), [exercises, search])
  const canSave = Boolean(exerciseId) && validWeight && isValidDate(achievedAt) && !saving

  const handleExerciseSearch = (value: string) => {
    setSearch(value)
    const selected = exercises.find((exercise) => exercise.id === exerciseId)
    if (!selected || normalize(value) !== normalize(selected.name)) setExerciseId('')
  }

  const selectExercise = (exercise: Exercise) => { setExerciseId(exercise.id); setSearch(exercise.name); setMessage(null) }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSave) return
    setSaving(true)
    setMessage(null)
    try { const record = await createPersonalRecord({ exerciseId, weight: parsedWeight, achievedAt, notes: notes.trim() || null }); await onSaved(record.exerciseId); onClose() }
    catch (error) { setMessage(error instanceof Error ? `No se pudo guardar el PR: ${error.message}` : 'No se pudo guardar el PR.') }
    finally { setSaving(false) }
  }

  return <div aria-modal="true" className="pr-modal-backdrop" role="dialog"><section className="pr-modal"><div className="pr-modal-heading"><div><p className="eyebrow">NUEVA MARCA</p><h2>Agregar PR</h2></div><button aria-label="Cerrar" className="modal-close" disabled={saving} onClick={onClose} type="button">×</button></div><form className="pr-form" onSubmit={(event) => void handleSubmit(event)}><label>Ejercicio<input aria-autocomplete="list" aria-controls="exercise-options" autoComplete="off" onChange={(event) => handleExerciseSearch(event.target.value)} placeholder="Buscá o elegí un ejercicio" role="combobox" type="search" value={search} /></label><div className="exercise-options" id="exercise-options" role="listbox">{filteredExercises.map((exercise) => <button aria-selected={exercise.id === exerciseId} className={exercise.id === exerciseId ? 'is-selected' : ''} key={exercise.id} onClick={() => selectExercise(exercise)} role="option" type="button">{exercise.name}</button>)}</div>{search.trim() !== '' && filteredExercises.length === 0 && <p className="exercise-empty">No encontramos ese ejercicio.</p>}<div className="pr-form-row"><label>Peso (kg)<input inputMode="decimal" onChange={(event) => setWeight(event.target.value)} placeholder="100" required value={weight} /></label><label>Fecha<input onChange={(event) => setAchievedAt(event.target.value)} required type="date" value={achievedAt} /></label></div><label>Notas <span>opcional</span><textarea onChange={(event) => setNotes(event.target.value)} placeholder="Cómo se sintió la marca…" rows={3} value={notes} /></label><button className="pr-save" disabled={!canSave} type="submit">{saving ? 'Guardando…' : 'Guardar PR'}</button></form>{message && <p className="auth-message is-error" role="alert">{message}</p>}</section></div>
}
