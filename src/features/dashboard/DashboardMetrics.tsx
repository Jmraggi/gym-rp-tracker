import type { LatestImprovement } from './dashboard.types'

const formatKilograms = (weight: number): string => weight.toLocaleString('es-AR', { maximumFractionDigits: 2 })
const formatCalendarDate = (date: string): string => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export function WeeklyTrainingSummary({ weeklyTrainingDays, markingWorkout, workoutCompleted, onMarkWorkout }: { weeklyTrainingDays: number; markingWorkout: boolean; workoutCompleted: boolean; onMarkWorkout: () => void }) {
  return <section aria-label="Resumen semanal" className="visual-dashboard__weekly-summary"><div><span>Esta semana</span><strong>{weeklyTrainingDays}/7</strong><small>Días entrenados esta semana</small></div><WorkoutAction markingWorkout={markingWorkout} onMarkWorkout={onMarkWorkout} workoutCompleted={workoutCompleted}/></section>
}

export function DashboardMetrics({ totalWorkouts, latestImprovement }: { totalWorkouts: number; latestImprovement: LatestImprovement | null }) {
  const improvementLabel = latestImprovement ? `Última mejora: ${latestImprovement.exercise.name}, más ${formatKilograms(latestImprovement.difference)} kilogramos, ${formatCalendarDate(latestImprovement.record.achievedAt)}` : 'Todavía no hay mejoras registradas'
  return <section aria-label="Métricas de entrenamiento" className="visual-dashboard__motivation"><article aria-label={`Total histórico de entrenamientos: ${totalWorkouts}`}><span aria-hidden="true" className="visual-dashboard__badge visual-dashboard__badge--check">✓</span><div><strong>{totalWorkouts}</strong><small>Entrenamientos</small></div></article><article aria-label={improvementLabel} className={latestImprovement ? 'is-earned visual-dashboard__improvement' : 'visual-dashboard__improvement'}><span aria-hidden="true" className="visual-dashboard__badge visual-dashboard__badge--star">★</span><div><strong>{latestImprovement ? `+${formatKilograms(latestImprovement.difference)} kg` : '—'}</strong>{latestImprovement ? <small><span>{latestImprovement.exercise.name}</span><time dateTime={latestImprovement.record.achievedAt}>{formatCalendarDate(latestImprovement.record.achievedAt)}</time></small> : <small>Sin mejoras todavía</small>}</div></article></section>
}

export function WorkoutAction({ markingWorkout, workoutCompleted, onMarkWorkout }: { markingWorkout: boolean; workoutCompleted: boolean; onMarkWorkout: () => void }) {
  return <button aria-label={workoutCompleted ? 'Entreno de hoy marcado' : 'Marcar entreno de hoy'} aria-pressed={workoutCompleted} className={`visual-dashboard__workout-action${workoutCompleted ? ' is-complete' : ''}`} disabled={workoutCompleted || markingWorkout} onClick={onMarkWorkout} type="button"><span aria-hidden="true">✓</span>{workoutCompleted ? 'Entreno de hoy marcado' : markingWorkout ? 'Marcando…' : 'Marcar entreno'}</button>
}
