import type { PersonalRecord, PersonalRecordTimelineEntry } from './personalRecords.types'

export const comparePersonalRecordsChronologically = (left: PersonalRecord, right: PersonalRecord): number => left.achievedAt.localeCompare(right.achievedAt)
  || left.createdAt.localeCompare(right.createdAt)
  || left.id.localeCompare(right.id)

export const getPersonalRecordTimeline = (records: readonly PersonalRecord[]): PersonalRecordTimelineEntry[] => {
  let historicalBest: number | null = null
  const timeline: PersonalRecordTimelineEntry[] = [...records].sort(comparePersonalRecordsChronologically).map((record, index) => {
    const previousBest = historicalBest
    const difference = previousBest !== null && record.weight > previousBest ? record.weight - previousBest : null
    const milestone = index === 0 ? 'initial' : difference !== null ? 'improvement' : 'regular'
    historicalBest = Math.max(historicalBest ?? record.weight, record.weight)
    return { record, milestone, previousBest, difference, isCurrentPr: false }
  })
  const currentPrWeight = timeline.reduce<number | null>((best, entry) => Number.isFinite(entry.record.weight) ? Math.max(best ?? entry.record.weight, entry.record.weight) : best, null)
  const currentPrIndex = currentPrWeight === null ? -1 : timeline.findIndex((entry) => entry.record.weight === currentPrWeight)
  if (currentPrIndex >= 0) timeline[currentPrIndex] = { ...timeline[currentPrIndex], isCurrentPr: true }
  return timeline
}

export const getBestPersonalRecord = (records: readonly PersonalRecord[]): PersonalRecord => [...records].sort((left, right) => right.weight - left.weight || right.achievedAt.localeCompare(left.achievedAt) || right.createdAt.localeCompare(left.createdAt))[0]

export const getLatestPersonalRecord = (records: readonly PersonalRecord[]): PersonalRecord => [...records].sort((left, right) => right.achievedAt.localeCompare(left.achievedAt) || right.createdAt.localeCompare(left.createdAt))[0]
