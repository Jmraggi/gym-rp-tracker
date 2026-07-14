import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { LatestImprovement } from './dashboard.types'
import { DashboardMetrics, WorkoutAction } from './DashboardMetrics'

const improvement: LatestImprovement = {
  difference: 5,
  previousBest: 100,
  exercise: { id: 'squat', name: 'Sentadilla', category: 'squat', isDefault: true, sortOrder: 1 },
  record: { id: 'record-2', userId: 'user-1', exerciseId: 'squat', weight: 105, achievedAt: '2026-07-14', notes: null, createdAt: '2026-07-14T12:00:00Z', updatedAt: '2026-07-14T12:00:00Z' },
}

describe('DashboardMetrics', () => {
  it('renders the independent total, weekly ratio, and empty improvement state', () => {
    const html = renderToStaticMarkup(<DashboardMetrics latestImprovement={null} totalWorkouts={12} weeklyTrainingDays={3}/>)
    expect(html).toContain('Total histórico de entrenamientos: 12')
    expect(html).toContain('3/7')
    expect(html).toContain('Días entrenados esta semana')
    expect(html).toContain('Sin mejoras')
  })

  it('renders the latest improvement details', () => {
    const html = renderToStaticMarkup(<DashboardMetrics latestImprovement={improvement} totalWorkouts={12} weeklyTrainingDays={3}/>)
    expect(html).toContain('+5 kg')
    expect(html).toContain('Sentadilla')
    expect(html).toContain('dateTime="2026-07-14"')
  })
})

describe('WorkoutAction', () => {
  it('renders independent available, pending, and completed states', () => {
    expect(renderToStaticMarkup(<WorkoutAction markingWorkout={false} onMarkWorkout={() => undefined} workoutCompleted={false}/>)).toContain('Marcar entreno')
    expect(renderToStaticMarkup(<WorkoutAction markingWorkout onMarkWorkout={() => undefined} workoutCompleted={false}/>)).toContain('Marcando…')
    const completed = renderToStaticMarkup(<WorkoutAction markingWorkout={false} onMarkWorkout={() => undefined} workoutCompleted/>)
    expect(completed).toContain('Entreno de hoy marcado')
    expect(completed).toContain('disabled=""')
  })
})
