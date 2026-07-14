// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LatestImprovement } from './dashboard.types'
import { DashboardMetrics, WeeklyTrainingSummary } from './DashboardMetrics'

const improvement: LatestImprovement = {
  difference: 5,
  previousBest: 100,
  exercise: { id: 'squat', name: 'Sentadilla', category: 'squat', isDefault: true, sortOrder: 1 },
  record: { id: 'record-2', userId: 'user-1', exerciseId: 'squat', weight: 105, achievedAt: '2026-07-14', notes: null, createdAt: '2026-07-14T12:00:00Z', updatedAt: '2026-07-14T12:00:00Z' },
}

afterEach(cleanup)

describe('DashboardMetrics', () => {
  it('renders the independent total and empty improvement state', () => {
    render(<DashboardMetrics latestImprovement={null} totalWorkouts={12}/>)
    expect(screen.getByLabelText('Total histórico de entrenamientos: 12')).toBeTruthy()
    expect(screen.getByText('Sin mejoras todavía')).toBeTruthy()
  })

  it('renders the latest improvement details', () => {
    render(<DashboardMetrics latestImprovement={improvement} totalWorkouts={12}/>)
    expect(screen.getByText('+5 kg')).toBeTruthy()
    expect(screen.getByText('Sentadilla')).toBeTruthy()
    expect(screen.getByText('14 jul').getAttribute('datetime')).toBe('2026-07-14')
  })
})

describe('WeeklyTrainingSummary', () => {
  it('keeps the weekly ratio and workout action together', () => {
    const onMarkWorkout = vi.fn()
    render(<WeeklyTrainingSummary markingWorkout={false} onMarkWorkout={onMarkWorkout} weeklyTrainingDays={3} workoutCompleted={false}/>)
    expect(screen.getByText('3/7')).toBeTruthy()
    expect(screen.getByText('Días entrenados esta semana')).toBeTruthy()
    const button = screen.getByRole('button', { name: 'Marcar entreno de hoy' })
    fireEvent.click(button)
    expect(onMarkWorkout).toHaveBeenCalledOnce()
  })

  it('renders pending and completed workout states', () => {
    const { rerender } = render(<WeeklyTrainingSummary markingWorkout onMarkWorkout={() => undefined} weeklyTrainingDays={3} workoutCompleted={false}/>)
    expect(screen.getByText('Marcando…')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Marcar entreno de hoy' }) as HTMLButtonElement).disabled).toBe(true)
    rerender(<WeeklyTrainingSummary markingWorkout={false} onMarkWorkout={() => undefined} weeklyTrainingDays={4} workoutCompleted/>)
    const completed = screen.getByRole('button', { name: 'Entreno de hoy marcado' })
    expect(completed.getAttribute('aria-pressed')).toBe('true')
    expect((completed as HTMLButtonElement).disabled).toBe(true)
  })
})
