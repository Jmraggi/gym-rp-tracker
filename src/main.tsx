import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './auth/AuthContext.tsx'
import { QuickAddPersonalRecordProvider } from './features/personal-records/QuickAddPersonalRecord.tsx'
import './index.css'
import App from './App.tsx'

const isStandalonePwa =
  window.matchMedia('(display-mode: standalone)').matches ||
  Boolean((navigator as Navigator & { standalone?: boolean }).standalone)

if (import.meta.env.DEV || new URLSearchParams(window.location.search).has('pwa-debug')) {
  console.info('[PWA] Modo standalone:', isStandalonePwa)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <QuickAddPersonalRecordProvider><App /></QuickAddPersonalRecordProvider>
    </AuthProvider>
  </StrictMode>,
)
