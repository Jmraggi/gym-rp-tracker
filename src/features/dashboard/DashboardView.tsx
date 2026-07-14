import { DashboardMetrics, WeeklyTrainingSummary } from './DashboardMetrics'
import { PrComparisonChart } from './PrComparisonChart'
import type { ExerciseProgress, LatestImprovement } from './dashboard.types'
import { WorkoutCalendar } from './WorkoutCalendar'

interface DashboardViewProps {
  latestImprovement: LatestImprovement | null
  loading: boolean
  markingWorkout: boolean
  onMarkWorkout: () => void
  onRemoveWorkout: (date: string) => Promise<void>
  progresses: ExerciseProgress[]
  totalWorkouts: number
  trainingDates: string[]
  weeklyTrainingDays: number
  workoutCompleted: boolean
}

function DashboardLoading() {
  return <section aria-label="Cargando dashboard" className="visual-dashboard visual-dashboard--loading" role="status"><span className="sr-only">Cargando dashboard…</span><div className="visual-dashboard__loading-card visual-dashboard__loading-card--summary"/><div className="visual-dashboard__loading-card visual-dashboard__loading-card--metrics"/><div className="visual-dashboard__loading-card visual-dashboard__loading-card--chart"/><div className="visual-dashboard__loading-card visual-dashboard__loading-card--calendar"/></section>
}

export function DashboardView({ latestImprovement, loading, markingWorkout, onMarkWorkout, onRemoveWorkout, progresses, totalWorkouts, trainingDates, weeklyTrainingDays, workoutCompleted }: DashboardViewProps) {
  if (loading) return <DashboardLoading/>

  return <section aria-label="Panel de progreso" className="visual-dashboard"><div className="visual-dashboard__primary"><WeeklyTrainingSummary markingWorkout={markingWorkout} onMarkWorkout={onMarkWorkout} weeklyTrainingDays={weeklyTrainingDays} workoutCompleted={workoutCompleted}/><PrComparisonChart progresses={progresses}/></div><aside aria-label="Resumen complementario" className="visual-dashboard__secondary"><DashboardMetrics latestImprovement={latestImprovement} totalWorkouts={totalWorkouts}/><WorkoutCalendar dates={trainingDates} onRemoveWorkout={onRemoveWorkout}/></aside></section>
}
