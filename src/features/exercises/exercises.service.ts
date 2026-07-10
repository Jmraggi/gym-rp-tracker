import { supabase } from '../../lib/supabase'
import type { Exercise, ExerciseCategory } from './exercises.types'

const toExercise = (row: { id: string; name: string; category: string; is_default: boolean; sort_order: number }): Exercise => ({
  id: row.id, name: row.name, category: row.category as ExerciseCategory, isDefault: row.is_default, sortOrder: row.sort_order,
})

export const getExercises = async (): Promise<Exercise[]> => {
  const { data, error } = await supabase.from('exercises').select('id, name, category, is_default, sort_order').order('name')
  if (error) throw new Error(error.message)
  return data.map(toExercise)
}
