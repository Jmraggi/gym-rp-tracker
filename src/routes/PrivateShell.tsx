import { Outlet } from 'react-router-dom'
import { MobileGlassNavigation } from '../components/layout/MobileGlassNavigation'
import { useQuickAddPersonalRecord } from '../features/personal-records/useQuickAddPersonalRecord'

export function PrivateShell() {
  const { openQuickAddPersonalRecord } = useQuickAddPersonalRecord()
  return <><Outlet /><MobileGlassNavigation onAddPersonalRecord={() => openQuickAddPersonalRecord()} /></>
}
