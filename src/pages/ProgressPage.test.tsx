// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Exercise } from '../features/exercises/exercises.types'
import type { PersonalRecord } from '../features/personal-records/personalRecords.types'

const serviceMocks = vi.hoisted(() => ({ getExercises: vi.fn(), getPersonalRecords: vi.fn() }))
vi.mock('../features/exercises/exercises.service', () => ({ getExercises: serviceMocks.getExercises }))
vi.mock('../features/personal-records/personalRecords.service', () => ({ getPersonalRecords: serviceMocks.getPersonalRecords }))
vi.mock('../components/layout/AppHeader', () => ({ AppHeader: () => <header data-testid="app-header"/> }))

import { ProgressPage } from './ProgressPage'

const exercises: Exercise[] = [
  { id: 'bench', name: 'Press banca', category: 'press', isDefault: true, sortOrder: 2 },
  { id: 'squat', name: 'Sentadilla trasera con un nombre especialmente largo', category: 'squat', isDefault: true, sortOrder: 1 },
]
const record = (id: string, exerciseId: string, weight: number, achievedAt: string, notes: string | null = null): PersonalRecord => ({ id, userId: 'user-1', exerciseId, weight, achievedAt, notes, createdAt: `${achievedAt}T10:00:00Z`, updatedAt: `${achievedAt}T10:00:00Z` })
const LocationProbe = () => { const location = useLocation(); return <output aria-label="Ubicación actual">{location.pathname}{location.search}</output> }
const renderPage = (entry: string) => render(<MemoryRouter initialEntries={[entry]}><Routes><Route element={<><ProgressPage/><LocationProbe/></>} path="/progreso"/></Routes></MemoryRouter>)

beforeEach(() => { serviceMocks.getExercises.mockResolvedValue(exercises); serviceMocks.getPersonalRecords.mockResolvedValue([record('1', 'squat', 100, '2026-07-01', 'Primera nota'), record('2', 'squat', 110, '2026-07-03')]) })
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('ProgressPage', () => {
  it('loads once, canonicalizes an invalid URL, and filters in memory when selecting', async () => {
    renderPage('/progreso?exercise=missing&source=dashboard')
    expect(screen.getByRole('status', { name: 'Cargando progreso' })).toBeTruthy()
    await screen.findByRole('heading', { name: 'Gráfico histórico' })
    await waitFor(() => expect(screen.getByLabelText('Ubicación actual').textContent).toBe('/progreso?exercise=squat&source=dashboard'))
    expect(serviceMocks.getExercises).toHaveBeenCalledTimes(1)
    expect(serviceMocks.getPersonalRecords).toHaveBeenCalledTimes(1)

    fireEvent.change(screen.getByLabelText('Ejercicio para ver el progreso'), { target: { value: 'bench' } })
    await waitFor(() => expect(screen.getByLabelText('Ubicación actual').textContent).toBe('/progreso?exercise=bench&source=dashboard'))
    expect(screen.getByText('No hay registros válidos para calcular el progreso.')).toBeTruthy()
    expect(serviceMocks.getExercises).toHaveBeenCalledTimes(1)
    expect(serviceMocks.getPersonalRecords).toHaveBeenCalledTimes(1)
  })

  it('keeps an already canonical URL stable', async () => {
    renderPage('/progreso?exercise=squat')
    await screen.findByRole('heading', { name: 'Gráfico histórico' })
    expect(screen.getByLabelText('Ubicación actual').textContent).toBe('/progreso?exercise=squat')
    await act(async () => undefined)
    expect(serviceMocks.getPersonalRecords).toHaveBeenCalledTimes(1)
  })

  it('shows persisted invalid data in history and announces its exclusion', async () => {
    serviceMocks.getPersonalRecords.mockResolvedValue([record('1', 'squat', 100, '2026-07-01'), record('2', 'squat', Number.NaN, '2026-02-30', 'Dato importado')])
    renderPage('/progreso?exercise=squat')
    expect((await screen.findByText(/1 registro no participó/)).getAttribute('role')).toBe('status')
    expect(screen.getByText('Dato no representable')).toBeTruthy()
    expect(screen.getByText('Dato importado')).toBeTruthy()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('renders empty catalog, load error, and retry', async () => {
    serviceMocks.getExercises.mockRejectedValueOnce(new Error('Sin conexión.')).mockResolvedValueOnce([])
    renderPage('/progreso?exercise=missing')
    expect((await screen.findByRole('alert')).textContent).toContain('Sin conexión.')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('heading', { name: 'No hay ejercicios disponibles' })).toBeTruthy()
    await waitFor(() => expect(screen.getByLabelText('Ubicación actual').textContent).toBe('/progreso'))
  })
})
