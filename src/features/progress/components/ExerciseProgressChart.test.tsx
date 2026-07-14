// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { Exercise } from '../../exercises/exercises.types'
import type { PersonalRecord } from '../../personal-records/personalRecords.types'
import { getExerciseProgressMetrics } from '../progress.metrics'
import { ExerciseProgressChart } from './ExerciseProgressChart'

const exercise: Exercise = { id: 'squat', name: 'Back Squat', category: 'squat', isDefault: true, sortOrder: 1 }
const record = (id: string, weight: number, achievedAt: string, notes: string | null = null): PersonalRecord => ({ id, userId: 'user-1', exerciseId: exercise.id, weight, achievedAt, notes, createdAt: `${achievedAt}T10:00:00Z`, updatedAt: `${achievedAt}T10:00:00Z` })

afterEach(cleanup)

describe('ExerciseProgressChart', () => {
  it('uses roving focus and activates points with keyboard', () => {
    const metrics = getExerciseProgressMetrics([record('1', 100, '2026-07-01'), record('2', 110, '2026-07-02', 'Marca sólida'), record('3', 105, '2026-07-03')])
    render(<ExerciseProgressChart exercise={exercise} metrics={metrics}/>)
    const points = screen.getAllByRole('button')
    expect(points.map((point) => point.getAttribute('tabindex'))).toEqual(['-1', '0', '-1'])

    fireEvent.keyDown(points[1], { key: 'ArrowLeft' })
    expect(points[0].getAttribute('tabindex')).toBe('0')
    expect(points[1].getAttribute('tabindex')).toBe('-1')
    fireEvent.keyDown(points[0], { key: 'End' })
    expect(points[2].getAttribute('tabindex')).toBe('0')
    fireEvent.keyDown(points[2], { key: 'Enter' })
    expect(screen.getByRole('status').textContent).toContain('105 kg')
    fireEvent.keyDown(points[2], { key: 'Home' })
    expect(points[0].getAttribute('tabindex')).toBe('0')
  })

  it('exposes milestone labels and notes without relying on color', () => {
    const metrics = getExerciseProgressMetrics([record('1', 100, '2026-07-01'), record('2', 110, '2026-07-02', 'Marca sólida')])
    render(<ExerciseProgressChart exercise={exercise} metrics={metrics}/>)
    expect(screen.getByRole('button', { name: /Back Squat.*nuevo PR, PR actual/i })).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('Marca sólida')
    expect(screen.getByText('PR inicial')).toBeTruthy()
    expect(screen.getByText('Nuevo PR')).toBeTruthy()
    expect(screen.getByText('PR actual')).toBeTruthy()
  })
})
