import { getExercises } from '../exercises/exercises.service'
import type { Exercise } from '../exercises/exercises.types'
import { supabase } from '../../lib/supabase'
import type { PersonalRecord, PersonalRecordFormData, PersonalRecordSummary, UpdatePersonalRecordInput } from './personalRecords.types'

const getSessionUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Tu sesión no está disponible. Volvé a iniciar sesión.')
  return data.user.id
}

const toPersonalRecord = (row: { id: string; user_id: string; exercise_id: string; weight: number; achieved_at: string; notes: string | null; created_at: string; updated_at: string }): PersonalRecord => ({
  id: row.id, userId: row.user_id, exerciseId: row.exercise_id, weight: row.weight, achievedAt: row.achieved_at, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at,
})

export const getPersonalRecords = async (): Promise<PersonalRecord[]> => {
  const { data, error } = await supabase.from('personal_records').select('id, user_id, exercise_id, weight, achieved_at, notes, created_at, updated_at').order('achieved_at', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data.map(toPersonalRecord)
}

export const createPersonalRecord = async (formData: PersonalRecordFormData): Promise<PersonalRecord> => {
  const userId = await getSessionUserId()
  const { data, error } = await supabase.from('personal_records').insert({ user_id: userId, exercise_id: formData.exerciseId, weight: formData.weight, achieved_at: formData.achievedAt, notes: formData.notes }).select('id, user_id, exercise_id, weight, achieved_at, notes, created_at, updated_at').single()
  if (error) throw new Error(error.message)
  return toPersonalRecord(data)
}

export const getPersonalRecordsByExercise = async (exerciseId: string): Promise<PersonalRecord[]> => {
  const { data, error } = await supabase.from('personal_records').select('id, user_id, exercise_id, weight, achieved_at, notes, created_at, updated_at').eq('exercise_id', exerciseId).order('achieved_at', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data.map(toPersonalRecord)
}

export const updatePersonalRecord = async ({ id, weight, achievedAt, notes }: UpdatePersonalRecordInput): Promise<PersonalRecord> => {
  const userId = await getSessionUserId()
  const { data, error } = await supabase.from('personal_records').update({ weight, achieved_at: achievedAt, notes }).eq('id', id).eq('user_id', userId).select('id, user_id, exercise_id, weight, achieved_at, notes, created_at, updated_at').maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('No se encontró el registro o ya no tenés permiso para modificarlo.')
  return toPersonalRecord(data)
}

export const deletePersonalRecord = async (recordId: string): Promise<void> => {
  const userId = await getSessionUserId()
  const { data, error } = await supabase.from('personal_records').delete().eq('id', recordId).eq('user_id', userId).select('id').maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('No se encontró el registro o ya no tenés permiso para eliminarlo.')
}

const createSummary = (exercise: Exercise, records: PersonalRecord[]): PersonalRecordSummary => {
  const latestRecord = getLatestPersonalRecord(records)
  const bestRecord = getBestPersonalRecord(records)
  return { exercise, bestRecord, latestRecord, recordCount: records.length }
}

export const getBestPersonalRecord = (records: readonly PersonalRecord[]): PersonalRecord => [...records].sort((a, b) => b.weight - a.weight || b.achievedAt.localeCompare(a.achievedAt) || b.createdAt.localeCompare(a.createdAt))[0]
export const getLatestPersonalRecord = (records: readonly PersonalRecord[]): PersonalRecord => [...records].sort((a, b) => b.achievedAt.localeCompare(a.achievedAt) || b.createdAt.localeCompare(a.createdAt))[0]
export const notifyPersonalRecordsChanged = (): void => { window.dispatchEvent(new Event('personal-records-updated')) }

export const getPersonalRecordSummaries = async (): Promise<PersonalRecordSummary[]> => {
  const [exercises, records] = await Promise.all([getExercises(), getPersonalRecords()])
  const recordsByExercise = new Map<string, PersonalRecord[]>()
  records.forEach((record) => recordsByExercise.set(record.exerciseId, [...(recordsByExercise.get(record.exerciseId) ?? []), record]))
  return exercises.flatMap((exercise) => {
    const exerciseRecords = recordsByExercise.get(exercise.id)
    return exerciseRecords ? [createSummary(exercise, exerciseRecords)] : []
  })
}

export const getExercisesWithPersonalRecords = async (): Promise<PersonalRecordSummary[]> => getPersonalRecordSummaries()

export const getPersonalRecordSummary = async (exerciseId: string): Promise<PersonalRecordSummary | null> => {
  const summaries = await getPersonalRecordSummaries()
  return summaries.find((summary) => summary.exercise.id === exerciseId) ?? null
}

export const getBestPersonalRecordByExercise = async (exerciseId: string): Promise<PersonalRecord | null> => {
  const summary = await getPersonalRecordSummary(exerciseId)
  return summary?.bestRecord ?? null
}
