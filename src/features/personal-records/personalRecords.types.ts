import type { Exercise } from '../exercises/exercises.types'

export interface PersonalRecord { id: string; exerciseId: string; weight: number; achievedAt: string; notes: string | null; createdAt: string }
export interface PersonalRecordFormData { exerciseId: string; weight: number; achievedAt: string; notes: string | null }
export interface PersonalRecordSummary { exercise: Exercise; bestRecord: PersonalRecord; latestRecord: PersonalRecord; recordCount: number }
