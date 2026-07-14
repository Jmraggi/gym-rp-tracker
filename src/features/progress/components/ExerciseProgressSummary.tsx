import type { Exercise } from '../../exercises/exercises.types'
import { formatProgressDate, formatProgressWeight } from '../progress.metrics'
import type { ExerciseProgressMetrics } from '../progress.types'

const formatSignedWeight = (value: number | null): string => value === null || !Number.isFinite(value) ? '—' : `${value >= 0 ? '+' : ''}${value.toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg`
const formatPercentage = (value: number | null): string => value === null || !Number.isFinite(value) ? 'No disponible' : `${value >= 0 ? '+' : ''}${value.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%`

export function ExerciseProgressSummary({ exercise, metrics }: { exercise: Exercise; metrics: ExerciseProgressMetrics }) {
  if (!metrics.currentPr || !metrics.firstRecord) return <section aria-label={`Resumen de ${exercise.name}`} className="progress-summary progress-summary--empty"><h2>Resumen</h2><p>No hay registros válidos para calcular el progreso.</p><span>{metrics.totalRecords} {metrics.totalRecords === 1 ? 'registro persistido' : 'registros persistidos'}</span></section>

  const improvement = metrics.latestImprovement
  const improvementText = improvement
    ? `${formatProgressDate(improvement.record.achievedAt)} · +${formatProgressWeight(improvement.difference ?? 0)} kg`
    : metrics.timeline.length === 1 ? 'Sin mejora previa' : 'Sin mejoras posteriores'

  return <section aria-label={`Resumen de ${exercise.name}`} className="progress-summary">
    <div className="progress-summary__primary"><article><span>PR actual</span><strong>{formatProgressWeight(metrics.currentPr.weight)} <small>kg</small></strong></article><article><span>Progreso</span><strong>{formatSignedWeight(metrics.absoluteProgress)}</strong><small>{formatPercentage(metrics.percentageProgress)}</small></article></div>
    <div className="progress-summary__secondary"><article><span>Primera marca</span><strong>{formatProgressWeight(metrics.firstRecord.weight)} kg</strong><small>{formatProgressDate(metrics.firstRecord.achievedAt)}</small></article><article><span>Última mejora real</span><strong>{improvementText}</strong></article><article><span>Total de registros</span><strong>{metrics.totalRecords}</strong><small>Persistidos para este ejercicio</small></article></div>
  </section>
}
