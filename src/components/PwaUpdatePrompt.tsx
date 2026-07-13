import { useEffect, useMemo, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

export function PwaUpdatePrompt() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>()
  const [isUpdating, setIsUpdating] = useState(false)
  const registerOptions = useMemo(() => ({
    onRegisteredSW: (_swUrl: string, nextRegistration: ServiceWorkerRegistration | undefined) => {
      setRegistration(nextRegistration)
    },
  }), [])
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW(registerOptions)

  useEffect(() => {
    if (!registration) return

    const checkForUpdate = () => void registration.update()
    const intervalId = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS)
    window.addEventListener('focus', checkForUpdate)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', checkForUpdate)
    }
  }, [registration])

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      await updateServiceWorker(true)
    } catch {
      setIsUpdating(false)
    }
  }

  if (!needRefresh) return null

  return <aside aria-live="polite" className="pwa-update-prompt" role="status">
    <div>
      <strong>Hay una nueva versión disponible.</strong>
      <span>Actualizá cuando termines lo que estás haciendo.</span>
    </div>
    <div className="pwa-update-prompt__actions">
      <button disabled={isUpdating} onClick={() => setNeedRefresh(false)} type="button">Más tarde</button>
      <button disabled={isUpdating} onClick={() => void handleUpdate()} type="button">
        {isUpdating ? 'Actualizando…' : 'Actualizar'}
      </button>
    </div>
  </aside>
}
