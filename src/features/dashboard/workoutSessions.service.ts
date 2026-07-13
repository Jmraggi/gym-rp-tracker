import { supabase } from '../../lib/supabase'

export const todayDate = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export async function getWorkoutDates(): Promise<string[]> {
  const { data, error } = await supabase.from('workout_sessions').select('trained_at').order('trained_at', { ascending: false })
  // Keep the established PR dashboard usable while an older database has not
  // received the optional workout-session migration yet.
  if (error?.code === 'PGRST205') return []
  if (error) throw error
  return data.map((session) => session.trained_at)
}

export async function getWorkoutDatesPage({ offset, limit }: { offset: number; limit: number }): Promise<{ dates: string[]; hasMore: boolean }> {
  const { data, error } = await supabase.from('workout_sessions').select('trained_at').order('trained_at', { ascending: false }).range(offset, offset + limit)
  if (error?.code === 'PGRST205') return { dates: [], hasMore: false }
  if (error) throw error
  return { dates: data.slice(0, limit).map((session) => session.trained_at), hasMore: data.length > limit }
}

export async function getWorkoutCount(): Promise<number> {
  const { count, error } = await supabase.from('workout_sessions').select('id', { count: 'exact', head: true })
  if (error?.code === 'PGRST205') return 0
  if (error) throw error
  return count ?? 0
}

export async function markWorkoutComplete(): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Necesitás iniciar sesión para registrar un entreno.')
  const { error } = await supabase.from('workout_sessions').upsert({ user_id: user.id, trained_at: todayDate() }, { onConflict: 'user_id,trained_at' })
  if (error) throw error
}

export async function removeWorkout(date: string): Promise<void> {
  const { error } = await supabase.from('workout_sessions').delete().eq('trained_at', date)
  if (error) throw error
}
