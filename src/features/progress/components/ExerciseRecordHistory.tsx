import type { Exercise } from '../../exercises/exercises.types'
import type { PersonalRecord, PersonalRecordTimelineEntry } from '../../personal-records/personalRecords.types'
import { formatProgressDate, formatProgressWeight, sortPersonalRecordsByRecent } from '../progress.metrics'
import type { ExerciseProgressMetrics } from '../progress.types'

const milestoneLabel = (entry: PersonalRecordTimelineEntry | undefined): string | null => {
  if (!entry) return null
  if (entry.milestone === 'initial') return entry.isCurrentPr ? 'PR inicial · PR actual' : 'PR inicial'
  if (entry.milestone === 'improvement') return entry.isCurrentPr ? 'Nuevo PR · PR actual' : 'Nuevo PR'
  return null
}

export function ExerciseRecordHistory({ exercise, metrics, records }: { exercise: Exercise; metrics: ExerciseProgressMetrics; records: PersonalRecord[] }) {
  const entriesById = new Map(metrics.timeline.map((entry) => [entry.record.id, entry]))
  const recentRecords = sortPersonalRecordsByRecent(records)
  return <section aria-labelledby="progress-history-title" className="progress-history"><div className="progress-section-heading"><div><p className="eyebrow">REGISTROS</p><h2 id="progress-history-title">Historial</h2></div><span>Más reciente primero</span></div>{recentRecords.length ? <ol>{recentRecords.map((record) => {
    const entry = entriesById.get(record.id)
    const label = milestoneLabel(entry)
    return <li key={record.id}><article aria-label={`Registro de ${exercise.name}`}><div className="progress-history__main"><time dateTime={formatProgressDate(record.achievedAt) === '—' ? undefined : record.achievedAt}>{formatProgressDate(record.achievedAt)}</time><strong>{formatProgressWeight(record.weight)}{formatProgressWeight(record.weight) !== '—' && <small> kg</small>}</strong></div><div className="progress-history__meta">{label && <span className="progress-history__badge">{label}</span>}{entry?.difference !== null && entry?.difference !== undefined && <span>+{formatProgressWeight(entry.difference)} kg vs. récord anterior</span>}{!entry && <span className="progress-history__invalid">Dato no representable</span>}</div>{record.notes && <p>{record.notes}</p>}</article></li>
  })}</ol> : <p className="progress-empty-copy">Este ejercicio todavía no tiene registros.</p>}</section>
}
