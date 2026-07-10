import { useEffect, useState } from 'react'
import { PersonalRecordModal } from '../PersonalRecordModal'
import { deletePersonalRecord, getPersonalRecordsByExercise, notifyPersonalRecordsChanged } from '../personalRecords.service'
import type { PersonalRecord, PersonalRecordSummary } from '../personalRecords.types'
import type { Exercise } from '../../exercises/exercises.types'
import { useOverlayLock } from '../../../components/layout/useOverlayLock'

interface PersonalRecordHistoryProps { summary: PersonalRecordSummary; exercises: Exercise[]; onChanged: () => Promise<void> }
const formatWeight = (weight: number): string => weight.toLocaleString('es-AR', { maximumFractionDigits: 2 })
const formatDate = (date: string): string => new Date(`${date}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

export function PersonalRecordHistory({ summary, exercises, onChanged }: PersonalRecordHistoryProps) {
  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [editing, setEditing] = useState<PersonalRecord | null>(null)
  const [deleting, setDeleting] = useState<PersonalRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  useOverlayLock(deleting !== null)

  const reload = async () => {
    const nextRecords = await getPersonalRecordsByExercise(summary.exercise.id)
    setRecords(nextRecords)
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    void getPersonalRecordsByExercise(summary.exercise.id).then((nextRecords) => { if (active) setRecords(nextRecords) }).catch((error: unknown) => { if (active) setMessage(error instanceof Error ? `No se pudo cargar el historial: ${error.message}` : 'No se pudo cargar el historial.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [summary.exercise.id])

  const handleChanged = async (_exerciseId: string) => { await reload(); await onChanged() }
  const handleDelete = async () => {
    if (!deleting) return
    setIsDeleting(true); setMessage(null)
    try { await deletePersonalRecord(deleting.id); notifyPersonalRecordsChanged(); setDeleting(null); await reload(); await onChanged() }
    catch (error) { setMessage(error instanceof Error ? `No se pudo eliminar el registro: ${error.message}` : 'No se pudo eliminar el registro.') }
    finally { setIsDeleting(false) }
  }

  return <section className="pr-history"><h4>Historial completo</h4>{loading ? <p className="account-status">Cargando historial…</p> : records.length === 0 ? <p className="account-status">No hay registros para este ejercicio.</p> : <div className="pr-history-list">{records.map((record) => <article className="pr-history-item" key={record.id}><div><strong>{formatWeight(record.weight)} kg</strong><span>{formatDate(record.achievedAt)}</span></div><div className="pr-history-badges">{record.id === summary.bestRecord.id && <b>Mejor PR</b>}{record.id === summary.latestRecord.id && <b className="is-secondary">Último registro</b>}</div>{record.notes && <p>{record.notes}</p>}<div className="pr-history-actions"><button onClick={() => setEditing(record)} type="button">Editar</button><button className="is-danger" onClick={() => setDeleting(record)} type="button">Eliminar</button></div></article>)}</div>}{message && <p className="auth-message is-error" role="alert">{message}</p>}{editing && <PersonalRecordModal exercises={exercises} initialExerciseId={summary.exercise.id} key={editing.id} onClose={() => setEditing(null)} onSaved={handleChanged} recordToEdit={editing} />}{deleting && <div aria-modal="true" className="pr-modal-backdrop" role="dialog"><section className="delete-dialog"><h3>Eliminar registro</h3><p>¿Eliminar este registro de {formatWeight(deleting.weight)} kg del {formatDate(deleting.achievedAt)}?</p><div><button disabled={isDeleting} onClick={() => setDeleting(null)} type="button">Cancelar</button><button className="is-danger" disabled={isDeleting} onClick={() => void handleDelete()} type="button">{isDeleting ? 'Eliminando…' : 'Eliminar registro'}</button></div></section></div>}</section>
}
