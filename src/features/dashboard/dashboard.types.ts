import type { Exercise } from '../exercises/exercises.types'
import type { PersonalRecord } from '../personal-records/personalRecords.types'

export interface RecordWithExercise { exercise: Exercise; record: PersonalRecord }
export interface LatestImprovement extends RecordWithExercise { difference: number; previousBest: number }
export interface DashboardSummary {
  totalRecords: number
  exerciseCount: number
  latestRecord: RecordWithExercise | null
  latestImprovement: LatestImprovement | null
}
export interface ExerciseProgress {
  exercise: Exercise
  records: PersonalRecord[]
  firstRecord: PersonalRecord
  bestRecord: PersonalRecord
  latestRecord: PersonalRecord
  totalProgress: number
}
