import type { Exercise } from '../exercises/exercises.types'
import { getBestPersonalRecord, getLatestPersonalRecord } from '../personal-records/personalRecords.service'
import type { PersonalRecord, PersonalRecordSummary } from '../personal-records/personalRecords.types'
import type { ChartPoint, DashboardSummary, ExerciseProgress, LatestImprovement, RecordWithExercise } from './dashboard.types'

const byChronologicalOrder = (left: PersonalRecord, right: PersonalRecord): number => left.achievedAt.localeCompare(right.achievedAt) || left.createdAt.localeCompare(right.createdAt)
const byRecentOrder = (left: PersonalRecord, right: PersonalRecord): number => right.achievedAt.localeCompare(left.achievedAt) || right.createdAt.localeCompare(left.createdAt)

const recordsByExercise = (records: readonly PersonalRecord[]): Map<string, PersonalRecord[]> => {
  const grouped = new Map<string, PersonalRecord[]>()
  records.forEach((record) => grouped.set(record.exerciseId, [...(grouped.get(record.exerciseId) ?? []), record]))
  return grouped
}

export const getPersonalRecordSummariesFromRecords = (exercises: readonly Exercise[], records: readonly PersonalRecord[]): PersonalRecordSummary[] => {
  const grouped = recordsByExercise(records)
  return exercises.flatMap((exercise) => {
    const exerciseRecords = grouped.get(exercise.id)
    if (!exerciseRecords || exerciseRecords.length === 0) return []
    return [{ exercise, bestRecord: getBestPersonalRecord(exerciseRecords), latestRecord: getLatestPersonalRecord(exerciseRecords), recordCount: exerciseRecords.length }]
  })
}

export const getRecentRecords = (exercises: readonly Exercise[], records: readonly PersonalRecord[], limit = 5): RecordWithExercise[] => {
  const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise]))
  return [...records].sort(byRecentOrder).flatMap((record) => {
    const exercise = exerciseMap.get(record.exerciseId)
    return exercise ? [{ exercise, record }] : []
  }).slice(0, limit)
}

export const getLatestImprovement = (exercises: readonly Exercise[], records: readonly PersonalRecord[]): LatestImprovement | null => {
  const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise]))
  const improvements: LatestImprovement[] = []
  recordsByExercise(records).forEach((exerciseRecords, exerciseId) => {
    const exercise = exerciseMap.get(exerciseId)
    if (!exercise) return
    let previousBest: number | null = null
    ;[...exerciseRecords].sort(byChronologicalOrder).forEach((record) => {
      if (previousBest !== null && record.weight > previousBest) improvements.push({ exercise, record, previousBest, difference: record.weight - previousBest })
      previousBest = Math.max(previousBest ?? record.weight, record.weight)
    })
  })
  return improvements.sort((left, right) => byRecentOrder(left.record, right.record))[0] ?? null
}

export const getDashboardSummary = (exercises: readonly Exercise[], records: readonly PersonalRecord[]): DashboardSummary => {
  const recentRecords = getRecentRecords(exercises, records, 1)
  return { totalRecords: records.length, exerciseCount: new Set(records.map((record) => record.exerciseId)).size, latestRecord: recentRecords[0] ?? null, latestImprovement: getLatestImprovement(exercises, records) }
}

export const getExerciseProgress = (exercise: Exercise, records: readonly PersonalRecord[]): ExerciseProgress | null => {
  const exerciseRecords = records.filter((record) => record.exerciseId === exercise.id).sort(byChronologicalOrder)
  if (exerciseRecords.length === 0) return null
  const firstRecord = exerciseRecords[0]
  const bestRecord = getBestPersonalRecord(exerciseRecords)
  return { exercise, records: exerciseRecords, firstRecord, bestRecord, latestRecord: getLatestPersonalRecord(exerciseRecords), totalProgress: bestRecord.weight - firstRecord.weight }
}

export const getChartPoints = (progress: ExerciseProgress | null): ChartPoint[] => progress?.records.map((record) => ({ id: record.id, weight: record.weight, achievedAt: record.achievedAt, createdAt: record.createdAt, notes: record.notes })) ?? []
