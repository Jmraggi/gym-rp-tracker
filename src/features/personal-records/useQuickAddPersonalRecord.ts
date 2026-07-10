import { useContext } from 'react'
import { QuickAddPersonalRecordContext } from './quickAddPersonalRecord.context'

export function useQuickAddPersonalRecord() {
  const context = useContext(QuickAddPersonalRecordContext)
  if (!context) throw new Error('useQuickAddPersonalRecord debe usarse dentro de QuickAddPersonalRecordProvider.')
  return context
}
