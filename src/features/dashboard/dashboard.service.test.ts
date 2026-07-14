import { describe, expect, it } from 'vitest'
import type { Exercise } from '../exercises/exercises.types'
import type { PersonalRecord } from '../personal-records/personalRecords.types'
import { getLatestImprovement, getWeeklyTrainingDays } from './dashboard.service'

const exercise = (id: string, name: string): Exercise => ({ id, name, category: 'strength', isDefault: false, sortOrder: 0 })
const record = (id: string, exerciseId: string, weight: number, achievedAt: string, createdAt: string): PersonalRecord => ({ id, userId: 'user-1', exerciseId, weight, achievedAt, createdAt, updatedAt: createdAt, notes: null })

describe('getWeeklyTrainingDays', () => {
  it('counts unique local calendar dates from Monday through Sunday', () => {
    const dates = ['2026-07-13', '2026-07-13', '2026-07-14', '2026-07-19', '2026-07-12', '2026-07-20']
    expect(getWeeklyTrainingDays(dates, new Date(2026, 6, 15, 12))).toBe(3)
  })

  it('returns zero for an empty week and changes the range on Monday', () => {
    const dates = ['2026-07-19', '2026-07-20']
    expect(getWeeklyTrainingDays([], new Date(2026, 6, 19, 12))).toBe(0)
    expect(getWeeklyTrainingDays(dates, new Date(2026, 6, 19, 23, 59))).toBe(1)
    expect(getWeeklyTrainingDays(dates, new Date(2026, 6, 20, 0, 1))).toBe(1)
  })
})

describe('getLatestImprovement', () => {
  const squat = exercise('squat', 'Sentadilla')
  const press = exercise('press', 'Press banca')

  it('compares each record with the previous historical best', () => {
    const improvement = getLatestImprovement([squat], [
      record('1', squat.id, 100, '2026-07-01', '2026-07-01T10:00:00Z'),
      record('2', squat.id, 90, '2026-07-02', '2026-07-02T10:00:00Z'),
      record('3', squat.id, 105, '2026-07-03', '2026-07-03T10:00:00Z'),
      record('4', squat.id, 105, '2026-07-04', '2026-07-04T10:00:00Z'),
    ])
    expect(improvement).toMatchObject({ record: { id: '3' }, previousBest: 100, difference: 5 })
  })

  it('chooses the latest event by achievedAt and then createdAt across exercises', () => {
    const improvement = getLatestImprovement([squat, press], [
      record('1', squat.id, 100, '2026-07-01', '2026-07-01T10:00:00Z'),
      record('2', squat.id, 110, '2026-07-06', '2026-07-06T10:00:00Z'),
      record('3', press.id, 50, '2026-07-02', '2026-07-02T10:00:00Z'),
      record('4', press.id, 60, '2026-07-06', '2026-07-06T11:00:00Z'),
    ])
    expect(improvement).toMatchObject({ exercise: { id: press.id }, record: { id: '4' }, previousBest: 50, difference: 10 })
  })

  it('ignores first records, ties, and regressions', () => {
    expect(getLatestImprovement([squat], [
      record('1', squat.id, 100, '2026-07-01', '2026-07-01T10:00:00Z'),
      record('2', squat.id, 100, '2026-07-02', '2026-07-02T10:00:00Z'),
      record('3', squat.id, 95, '2026-07-03', '2026-07-03T10:00:00Z'),
    ])).toBeNull()
  })
})
