import { describe, expect, it } from 'vitest'
import { comparePersonalRecordsChronologically, getPersonalRecordTimeline } from '../personal-records/personalRecords.metrics'
import type { PersonalRecord } from '../personal-records/personalRecords.types'
import { formatProgressDate, formatProgressWeight, getExerciseProgressMetrics, isValidProgressRecord } from './progress.metrics'

const record = (id: string, weight: number, achievedAt: string, createdAt: string): PersonalRecord => ({ id, userId: 'user-1', exerciseId: 'squat', weight, achievedAt, createdAt, updatedAt: createdAt, notes: null })

describe('personal record timeline', () => {
  it('orders by achievedAt, createdAt, and id for deterministic milestones', () => {
    const records = [
      record('c', 110, '2026-07-02', '2026-07-02T10:00:00Z'),
      record('b', 105, '2026-07-01', '2026-07-01T10:00:00Z'),
      record('a', 100, '2026-07-01', '2026-07-01T10:00:00Z'),
    ]
    expect([...records].sort(comparePersonalRecordsChronologically).map(({ id }) => id)).toEqual(['a', 'b', 'c'])
    expect(getPersonalRecordTimeline(records).map(({ milestone, record: item }) => [item.id, milestone])).toEqual([['a', 'initial'], ['b', 'improvement'], ['c', 'improvement']])
  })

  it('marks strict improvements, ignores ties and regressions, and identifies the first current PR', () => {
    const timeline = getPersonalRecordTimeline([
      record('1', 100, '2026-07-01', '2026-07-01T10:00:00Z'),
      record('2', 90, '2026-07-02', '2026-07-02T10:00:00Z'),
      record('3', 110, '2026-07-03', '2026-07-03T10:00:00Z'),
      record('4', 110, '2026-07-04', '2026-07-04T10:00:00Z'),
      record('5', 105, '2026-07-05', '2026-07-05T10:00:00Z'),
    ])
    expect(timeline.map(({ milestone }) => milestone)).toEqual(['initial', 'regular', 'improvement', 'regular', 'regular'])
    expect(timeline[2]).toMatchObject({ difference: 10, previousBest: 100, isCurrentPr: true })
    expect(timeline[3].isCurrentPr).toBe(false)
  })
})

describe('getExerciseProgressMetrics', () => {
  it('calculates first mark, current PR, absolute and percentage progress, and latest improvement', () => {
    const metrics = getExerciseProgressMetrics([
      record('1', 100, '2026-07-01', '2026-07-01T10:00:00Z'),
      record('2', 90, '2026-07-02', '2026-07-02T10:00:00Z'),
      record('3', 110, '2026-07-03', '2026-07-03T10:00:00Z'),
      record('4', 115, '2026-07-04', '2026-07-04T10:00:00Z'),
      record('5', 108, '2026-07-05', '2026-07-05T10:00:00Z'),
    ])
    expect(metrics.firstRecord?.id).toBe('1')
    expect(metrics.currentPr?.id).toBe('4')
    expect(metrics.absoluteProgress).toBe(15)
    expect(metrics.percentageProgress).toBe(15)
    expect(metrics.latestImprovement?.record.id).toBe('4')
    expect(metrics.latestImprovement?.difference).toBe(5)
  })

  it('returns zero progress and no previous improvement for one record', () => {
    const metrics = getExerciseProgressMetrics([record('1', 100, '2026-07-01', '2026-07-01T10:00:00Z')])
    expect(metrics.absoluteProgress).toBe(0)
    expect(metrics.percentageProgress).toBe(0)
    expect(metrics.latestImprovement).toBeNull()
  })

  it('counts persisted records while excluding invalid weights and dates from metrics', () => {
    const invalidWeight = record('2', Number.NaN, '2026-07-02', '2026-07-02T10:00:00Z')
    const invalidDate = record('3', 120, '2026-02-30', '2026-07-03T10:00:00Z')
    const metrics = getExerciseProgressMetrics([record('1', 100, '2026-07-01', '2026-07-01T10:00:00Z'), invalidWeight, invalidDate])
    expect(metrics).toMatchObject({ totalRecords: 3, excludedRecords: 2, absoluteProgress: 0, percentageProgress: 0 })
    expect(metrics.timeline.map(({ record: item }) => item.id)).toEqual(['1'])
    expect(isValidProgressRecord(invalidWeight)).toBe(false)
    expect(isValidProgressRecord(invalidDate)).toBe(false)
    expect(formatProgressWeight(invalidWeight.weight)).toBe('—')
    expect(formatProgressDate(invalidDate.achievedAt)).toBe('—')
  })

  it('returns unavailable derived metrics when no valid records exist', () => {
    const metrics = getExerciseProgressMetrics([record('1', 0, 'invalid', '2026-07-01T10:00:00Z')])
    expect(metrics).toMatchObject({ totalRecords: 1, excludedRecords: 1, currentPr: null, firstRecord: null, absoluteProgress: null, percentageProgress: null })
  })
})
