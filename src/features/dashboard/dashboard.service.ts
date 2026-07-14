import type { Exercise } from '../exercises/exercises.types'
import { comparePersonalRecordsChronologically, getBestPersonalRecord, getLatestPersonalRecord, getPersonalRecordTimeline } from '../personal-records/personalRecords.metrics'
import type { PersonalRecord, PersonalRecordSummary } from '../personal-records/personalRecords.types'
import type { DashboardSummary, ExerciseProgress, LatestImprovement, RecordWithExercise } from './dashboard.types'

const byRecentOrder = (left: PersonalRecord, right: PersonalRecord): number => -comparePersonalRecordsChronologically(left, right)

const localDateKey = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

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
    getPersonalRecordTimeline(exerciseRecords).forEach(({ difference, milestone, previousBest, record }) => {
      if (milestone === 'improvement' && difference !== null && previousBest !== null) improvements.push({ exercise, record, previousBest, difference })
    })
  })
  return improvements.sort((left, right) => byRecentOrder(left.record, right.record))[0] ?? null
}

export const getWeeklyTrainingDays = (dates: readonly string[], referenceDate = new Date()): number => {
  const monday = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate())
  sunday.setDate(sunday.getDate() + 6)
  const mondayKey = localDateKey(monday)
  const sundayKey = localDateKey(sunday)
  return new Set(dates.filter((date) => date >= mondayKey && date <= sundayKey)).size
}

export const getDashboardSummary = (exercises: readonly Exercise[], records: readonly PersonalRecord[]): DashboardSummary => {
  const recentRecords = getRecentRecords(exercises, records, 1)
  return { totalRecords: records.length, exerciseCount: new Set(records.map((record) => record.exerciseId)).size, latestRecord: recentRecords[0] ?? null, latestImprovement: getLatestImprovement(exercises, records) }
}

export const getExerciseProgress = (exercise: Exercise, records: readonly PersonalRecord[]): ExerciseProgress | null => {
  const exerciseRecords = records.filter((record) => record.exerciseId === exercise.id).sort(comparePersonalRecordsChronologically)
  if (exerciseRecords.length === 0) return null
  const firstRecord = exerciseRecords[0]
  const bestRecord = getBestPersonalRecord(exerciseRecords)
  return { exercise, records: exerciseRecords, firstRecord, bestRecord, latestRecord: getLatestPersonalRecord(exerciseRecords), totalProgress: bestRecord.weight - firstRecord.weight }
}
