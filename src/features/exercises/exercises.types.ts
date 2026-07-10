export type ExerciseCategory = 'squat' | 'snatch' | 'clean' | 'clean_and_jerk' | 'jerk' | 'strength' | 'press' | 'other'

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  isDefault: boolean
  sortOrder: number
}

export const exerciseCategoryLabels: Record<ExerciseCategory, string> = {
  squat: 'Sentadillas', snatch: 'Snatch', clean: 'Clean', clean_and_jerk: 'Clean and Jerk', jerk: 'Jerk', strength: 'Fuerza', press: 'Press', other: 'Otros',
}
