import { useEffect, useRef, useState } from 'react'
import { useOverlayLock } from '../../components/layout/useOverlayLock'

const formatDateKey = (year: number, month: number, day: number): string => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const formatCalendarDate = (date: string): string => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function WorkoutDeleteDialog({ date, onClose, onRemove }: { date: string; onClose: () => void; onRemove: (date: string) => Promise<void> }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  useOverlayLock()

  useEffect(() => {
    cancelRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deleting) onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [deleting, onClose])

  const confirmRemoval = async () => {
    setDeleting(true)
    setError(null)
    try {
      await onRemove(date)
      onClose()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No se pudo eliminar el entreno. Intentá de nuevo.')
      setDeleting(false)
    }
  }

  return <div aria-modal="true" className="pr-modal-backdrop" role="dialog" aria-labelledby="workout-delete-title"><section className="delete-dialog"><h3 id="workout-delete-title">Eliminar entreno</h3><p>¿Querés eliminar el entreno del <time dateTime={date}>{formatCalendarDate(date)}</time>?</p>{error && <p className="auth-message is-error" role="alert">{error}</p>}<div><button disabled={deleting} onClick={onClose} ref={cancelRef} type="button">Cancelar</button><button className="is-danger" disabled={deleting} onClick={() => void confirmRemoval()} type="button">{deleting ? 'Eliminando…' : 'Eliminar entreno'}</button></div></section></div>
}

export function WorkoutCalendar({ dates, onRemoveWorkout, today = new Date() }: { dates: string[]; onRemoveWorkout: (date: string) => Promise<void>; today?: Date }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const loggedDays = new Set(dates)
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const cells = [...Array<null>(firstWeekday), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)]
  const monthLabel = today.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  const closeDialog = () => {
    setSelectedDate(null)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }

  return <><section aria-label={`Calendario de constancia de ${monthLabel}`} className="visual-dashboard__consistency"><div><h2>Constancia</h2><span>{monthLabel}</span></div><ol aria-hidden="true" className="visual-dashboard__weekdays">{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => <li key={day}>{day}</li>)}</ol><ol className="visual-dashboard__calendar">{cells.map((day, index) => { if (!day) return <li aria-hidden="true" className="is-blank" key={`blank-${index}`}/>; const date = formatDateKey(year, month, day); const completed = loggedDays.has(date); const isToday = day === today.getDate(); return <li className={`${completed ? 'is-active ' : ''}${isToday ? 'is-today' : ''}`} key={day}>{completed ? <button aria-label={`Revisar entreno del ${formatCalendarDate(date)}`} onClick={(event) => { triggerRef.current = event.currentTarget; setSelectedDate(date) }} type="button">{day}</button> : <span aria-label={isToday ? `Hoy, ${day}` : undefined}>{day}</span>}</li> })}</ol><p className="visual-dashboard__calendar-hint">Tocá un día marcado para eliminarlo.</p></section>{selectedDate && <WorkoutDeleteDialog date={selectedDate} onClose={closeDialog} onRemove={onRemoveWorkout}/>}</>
}
