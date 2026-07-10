import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../../auth/useAuth'
import { getExercises } from '../exercises/exercises.service'
import type { Exercise } from '../exercises/exercises.types'
import { PersonalRecordModal } from './PersonalRecordModal'
import { QuickAddPersonalRecordContext } from './quickAddPersonalRecord.context'

export function QuickAddPersonalRecordProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [initialExerciseId, setInitialExerciseId] = useState<string | null>(null)

  useEffect(() => { if (!user) setInitialExerciseId(null) }, [user])
  const openQuickAddPersonalRecord = (exerciseId = '') => {
    void getExercises().then((nextExercises) => { setExercises(nextExercises); setInitialExerciseId(exerciseId) })
  }
  const value = useMemo(() => ({ openQuickAddPersonalRecord }), [])

  return <QuickAddPersonalRecordContext.Provider value={value}>{children}{initialExerciseId !== null && <PersonalRecordModal exercises={exercises} initialExerciseId={initialExerciseId} key={initialExerciseId} onClose={() => setInitialExerciseId(null)} onSaved={async () => undefined} />}</QuickAddPersonalRecordContext.Provider>
}
