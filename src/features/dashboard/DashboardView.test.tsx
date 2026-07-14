// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MobileGlassNavigation } from '../../components/layout/MobileGlassNavigation'
import type { ExerciseProgress } from './dashboard.types'
import { DashboardView } from './DashboardView'

const record = { id: 'record-1', userId: 'user-1', exerciseId: 'bench', weight: 100, achievedAt: '2026-07-14', notes: null, createdAt: '2026-07-14T12:00:00Z', updatedAt: '2026-07-14T12:00:00Z' }
const progress: ExerciseProgress = {
  exercise: { id: 'bench', name: 'Press banca', category: 'press', isDefault: true, sortOrder: 1 },
  records: [record],
  firstRecord: record,
  bestRecord: record,
  latestRecord: record,
  totalProgress: 0,
}

const defaultProps = {
  latestImprovement: null,
  loading: false,
  markingWorkout: false,
  onMarkWorkout: vi.fn(),
  onRemoveWorkout: async () => undefined,
  progresses: [] as ExerciseProgress[],
  totalWorkouts: 0,
  trainingDates: [] as string[],
  weeklyTrainingDays: 0,
  workoutCompleted: false,
}

afterEach(cleanup)

describe('DashboardView', () => {
  it('renders a stable loading state', () => {
    render(<DashboardView {...defaultProps} loading/>)
    expect(screen.getByRole('status', { name: 'Cargando dashboard' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Marcar entreno de hoy' })).toBeNull()
  })

  it('renders empty workout, improvement, and PR states explicitly', () => {
    render(<DashboardView {...defaultProps}/>)
    expect(screen.getByText('0/7')).toBeTruthy()
    expect(screen.getByLabelText('Total histórico de entrenamientos: 0')).toBeTruthy()
    expect(screen.getByText('Sin mejoras todavía')).toBeTruthy()
    expect(screen.getByText('Todavía no hay PRs')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Marcar entreno de hoy' })).toBeTruthy()
  })

  it('exposes each PR with an accessible name', () => {
    render(<DashboardView {...defaultProps} progresses={[progress]}/>)
    expect(screen.getByRole('listitem', { name: 'Press banca: 100 kilogramos' })).toBeTruthy()
  })

  it('keeps a single global action for adding a PR', () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><DashboardView {...defaultProps}/><MobileGlassNavigation onAddPersonalRecord={() => undefined}/></MemoryRouter>)
    expect(screen.getAllByRole('button', { name: 'Agregar PR' })).toHaveLength(1)
  })
})
