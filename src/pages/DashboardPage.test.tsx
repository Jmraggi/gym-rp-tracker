// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const serviceMocks = vi.hoisted(() => ({
  getExercises: vi.fn(),
  getPersonalRecords: vi.fn(),
  getWorkoutCount: vi.fn(),
  getWorkoutDates: vi.fn(),
  markWorkoutComplete: vi.fn(),
  removeWorkout: vi.fn(),
  todayDate: vi.fn(() => '2026-07-14'),
}))

vi.mock('../features/exercises/exercises.service', () => ({ getExercises: serviceMocks.getExercises }))
vi.mock('../features/personal-records/personalRecords.service', () => ({ getPersonalRecords: serviceMocks.getPersonalRecords }))
vi.mock('../features/dashboard/workoutSessions.service', () => ({
  getWorkoutCount: serviceMocks.getWorkoutCount,
  getWorkoutDates: serviceMocks.getWorkoutDates,
  markWorkoutComplete: serviceMocks.markWorkoutComplete,
  removeWorkout: serviceMocks.removeWorkout,
  todayDate: serviceMocks.todayDate,
}))

import { DashboardPage } from './DashboardPage'

beforeEach(() => {
  serviceMocks.getExercises.mockResolvedValue([])
  serviceMocks.getPersonalRecords.mockResolvedValue([])
  serviceMocks.getWorkoutCount.mockResolvedValue(0)
  serviceMocks.getWorkoutDates.mockResolvedValue([])
  serviceMocks.markWorkoutComplete.mockResolvedValue(undefined)
  serviceMocks.removeWorkout.mockResolvedValue(undefined)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('DashboardPage states', () => {
  it('announces loading and replaces it with the dashboard', async () => {
    let resolveExercises!: (value: unknown[]) => void
    serviceMocks.getExercises.mockReturnValue(new Promise<unknown[]>((resolve) => { resolveExercises = resolve }))
    render(<DashboardPage/>)
    expect(screen.getByRole('status', { name: 'Cargando dashboard' })).toBeTruthy()

    await act(async () => resolveExercises([]))
    await waitFor(() => expect(screen.queryByRole('status', { name: 'Cargando dashboard' })).toBeNull())
    expect(screen.getByRole('region', { name: 'Panel de progreso' })).toBeTruthy()
  })

  it('shows load errors and retries with the same refresh flow', async () => {
    serviceMocks.getExercises.mockRejectedValueOnce(new Error('Sin conexión.'))
    render(<DashboardPage/>)
    expect((await screen.findByRole('alert')).textContent).toContain('Sin conexión.')

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
    expect(screen.getByRole('region', { name: 'Panel de progreso' })).toBeTruthy()
  })

  it('keeps the workout action available after a visible save error', async () => {
    serviceMocks.markWorkoutComplete.mockRejectedValueOnce(new Error('No se pudo guardar.'))
    render(<DashboardPage/>)
    const button = await screen.findByRole('button', { name: 'Marcar entreno de hoy' })
    fireEvent.click(button)

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo guardar.')
    await waitFor(() => expect((screen.getByRole('button', { name: 'Marcar entreno de hoy' }) as HTMLButtonElement).disabled).toBe(false))
  })
})
