import { useEffect } from 'react'

let openOverlayCount = 0
let previousOverflow = ''

export function useOverlayLock(isOpen = true) {
  useEffect(() => {
    if (!isOpen) return
    if (openOverlayCount === 0) {
      previousOverflow = document.body.style.overflow
      document.body.classList.add('has-active-overlay')
      document.body.style.overflow = 'hidden'
    }
    openOverlayCount += 1
    return () => {
      openOverlayCount -= 1
      if (openOverlayCount === 0) {
        document.body.classList.remove('has-active-overlay')
        document.body.style.overflow = previousOverflow
      }
    }
  }, [isOpen])
}
