import type { Exercise } from '../exercises/exercises.types'

export interface PersonalRecord { id: string; userId: string; exerciseId: string; weight: number; achievedAt: string; notes: string | null; createdAt: string; updatedAt: string }
export interface PersonalRecordFormData { exerciseId: string; weight: number; achievedAt: string; notes: string | null }
export interface UpdatePersonalRecordInput { id: string; weight: number; achievedAt: string; notes: string | null }
export interface PersonalRecordSummary { exercise: Exercise; bestRecord: PersonalRecord; latestRecord: PersonalRecord; recordCount: number }
export type PersonalRecordMilestone = 'initial' | 'improvement' | 'regular'
export interface PersonalRecordTimelineEntry {
  record: PersonalRecord
  milestone: PersonalRecordMilestone
  previousBest: number | null
  difference: number | null
  isCurrentPr: boolean
}
