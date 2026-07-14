import { comparePersonalRecordsChronologically, getPersonalRecordTimeline } from '../personal-records/personalRecords.metrics'
import type { PersonalRecord } from '../personal-records/personalRecords.types'
import type { ExerciseProgressMetrics } from './progress.types'

export const parseLocalCalendarDate = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day, 12)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

export const isValidProgressRecord = (record: PersonalRecord): boolean => Number.isFinite(record.weight) && record.weight > 0 && parseLocalCalendarDate(record.achievedAt) !== null

export const formatProgressDate = (value: string, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }): string => {
  const date = parseLocalCalendarDate(value)
  return date ? date.toLocaleDateString('es-AR', options) : '—'
}

export const formatProgressWeight = (weight: number): string => Number.isFinite(weight) && weight > 0 ? weight.toLocaleString('es-AR', { maximumFractionDigits: 2 }) : '—'

export const getExerciseProgressMetrics = (records: readonly PersonalRecord[]): ExerciseProgressMetrics => {
  const validRecords = records.filter(isValidProgressRecord)
  const timeline = getPersonalRecordTimeline(validRecords)
  const firstRecord = timeline[0]?.record ?? null
  const currentPr = timeline.find((entry) => entry.isCurrentPr)?.record ?? null
  const latestImprovement = [...timeline].reverse().find((entry) => entry.milestone === 'improvement') ?? null
  const absoluteProgress = firstRecord && currentPr ? currentPr.weight - firstRecord.weight : null
  const percentageProgress = firstRecord && currentPr && firstRecord.weight > 0 ? (absoluteProgress! / firstRecord.weight) * 100 : null
  return { absoluteProgress, currentPr, excludedRecords: records.length - validRecords.length, firstRecord, latestImprovement, percentageProgress, timeline, totalRecords: records.length }
}

export const sortPersonalRecordsByRecent = (records: readonly PersonalRecord[]): PersonalRecord[] => [...records].sort((left, right) => -comparePersonalRecordsChronologically(left, right))
