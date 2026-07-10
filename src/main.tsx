import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './auth/AuthContext.tsx'
import { QuickAddPersonalRecordProvider } from './features/personal-records/QuickAddPersonalRecord.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <QuickAddPersonalRecordProvider><App /></QuickAddPersonalRecordProvider>
    </AuthProvider>
  </StrictMode>,
)
