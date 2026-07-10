import { createContext } from 'react'

export interface QuickAddPersonalRecordContextValue { openQuickAddPersonalRecord: (exerciseId?: string) => void }
export const QuickAddPersonalRecordContext = createContext<QuickAddPersonalRecordContextValue | undefined>(undefined)
