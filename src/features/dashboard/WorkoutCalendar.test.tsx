// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WorkoutCalendar } from './WorkoutCalendar'

const today = new Date(2026, 6, 14, 12)

afterEach(() => {
  cleanup()
  document.body.className = ''
  document.body.style.overflow = ''
})

describe('WorkoutCalendar', () => {
  it('opens a labelled confirmation and cancels without removing', async () => {
    const onRemoveWorkout = vi.fn(async () => undefined)
    render(<WorkoutCalendar dates={['2026-07-14']} onRemoveWorkout={onRemoveWorkout} today={today}/>)
    const trigger = screen.getByRole('button', { name: 'Revisar entreno del 14 de julio de 2026' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-labelledby')).toBe('workout-delete-title')
    const cancel = screen.getByRole('button', { name: 'Cancelar' })
    await waitFor(() => expect(document.activeElement).toBe(cancel))
    expect(document.body.classList.contains('has-active-overlay')).toBe(true)
    fireEvent.click(cancel)

    expect(onRemoveWorkout).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it('only removes after confirmation and blocks actions while pending', async () => {
    let resolveRemoval!: (value?: void | PromiseLike<void>) => void
    const pendingRemoval = new Promise<void>((resolve) => { resolveRemoval = resolve })
    const onRemoveWorkout = vi.fn(() => pendingRemoval)
    render(<WorkoutCalendar dates={['2026-07-14']} onRemoveWorkout={onRemoveWorkout} today={today}/>)
    fireEvent.click(screen.getByRole('button', { name: 'Revisar entreno del 14 de julio de 2026' }))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar entreno' }))

    expect(onRemoveWorkout).toHaveBeenCalledWith('2026-07-14')
    expect((screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Eliminando…' }) as HTMLButtonElement).disabled).toBe(true)
    await act(async () => resolveRemoval())
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('keeps the dialog open and exposes removal errors', async () => {
    const onRemoveWorkout = vi.fn(async () => { throw new Error('Sin permisos para eliminar.') })
    render(<WorkoutCalendar dates={['2026-07-14']} onRemoveWorkout={onRemoveWorkout} today={today}/>)
    fireEvent.click(screen.getByRole('button', { name: 'Revisar entreno del 14 de julio de 2026' }))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar entreno' }))

    expect((await screen.findByRole('alert')).textContent).toContain('Sin permisos para eliminar.')
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('closes with Escape and restores focus', async () => {
    const triggerName = 'Revisar entreno del 14 de julio de 2026'
    render(<WorkoutCalendar dates={['2026-07-14']} onRemoveWorkout={async () => undefined} today={today}/>)
    const trigger = screen.getByRole('button', { name: triggerName })
    fireEvent.click(trigger)
    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })
})
