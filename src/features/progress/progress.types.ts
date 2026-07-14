import type { PersonalRecord, PersonalRecordTimelineEntry } from '../personal-records/personalRecords.types'

export interface ExerciseProgressMetrics {
  absoluteProgress: number | null
  currentPr: PersonalRecord | null
  excludedRecords: number
  firstRecord: PersonalRecord | null
  latestImprovement: PersonalRecordTimelineEntry | null
  percentageProgress: number | null
  timeline: PersonalRecordTimelineEntry[]
  totalRecords: number
}
