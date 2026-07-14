import type { LatestImprovement } from './dashboard.types'

const formatKilograms = (weight: number): string => weight.toLocaleString('es-AR', { maximumFractionDigits: 2 })
const formatCalendarDate = (date: string): string => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export function DashboardMetrics({ totalWorkouts, weeklyTrainingDays, latestImprovement }: { totalWorkouts: number; weeklyTrainingDays: number; latestImprovement: LatestImprovement | null }) {
  const improvementLabel = latestImprovement ? `Última mejora: ${latestImprovement.exercise.name}, más ${formatKilograms(latestImprovement.difference)} kilogramos, ${formatCalendarDate(latestImprovement.record.achievedAt)}` : 'Todavía no hay mejoras registradas'
  return <section aria-label="Métricas de entrenamiento" className="visual-dashboard__motivation"><article aria-label={`Total histórico de entrenamientos: ${totalWorkouts}`}><span aria-hidden="true" className="visual-dashboard__badge visual-dashboard__badge--check">✓</span><strong>{totalWorkouts}</strong><small>entrenamientos</small></article><article aria-label={`${weeklyTrainingDays} de 7 días entrenados esta semana`}><span aria-hidden="true" className="visual-dashboard__badge visual-dashboard__badge--calendar"><svg viewBox="0 0 24 24"><rect height="16" rx="2" width="18" x="3" y="5"/><path d="M8 3v4M16 3v4M3 10h18"/></svg></span><strong>{weeklyTrainingDays}/7</strong><small>Días entrenados esta semana</small></article><article aria-label={improvementLabel} className={latestImprovement ? 'is-earned visual-dashboard__improvement' : 'visual-dashboard__improvement'}><span aria-hidden="true" className="visual-dashboard__badge visual-dashboard__badge--star">★</span><strong>{latestImprovement ? `+${formatKilograms(latestImprovement.difference)} kg` : '—'}</strong>{latestImprovement ? <small><span>{latestImprovement.exercise.name}</span><time dateTime={latestImprovement.record.achievedAt}>{formatCalendarDate(latestImprovement.record.achievedAt)}</time></small> : <small>Sin mejoras</small>}</article></section>
}

export function WorkoutAction({ markingWorkout, workoutCompleted, onMarkWorkout }: { markingWorkout: boolean; workoutCompleted: boolean; onMarkWorkout: () => void }) {
  return <button aria-label={workoutCompleted ? 'Entreno de hoy marcado' : 'Marcar entreno de hoy'} aria-pressed={workoutCompleted} className={`visual-dashboard__workout-action${workoutCompleted ? ' is-complete' : ''}`} disabled={workoutCompleted || markingWorkout} onClick={onMarkWorkout} type="button"><span aria-hidden="true">✓</span>{workoutCompleted ? 'Entreno de hoy marcado' : markingWorkout ? 'Marcando…' : 'Marcar entreno'}</button>
}
