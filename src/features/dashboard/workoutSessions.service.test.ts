import { beforeEach, describe, expect, it, vi } from 'vitest'

const { selectMock } = vi.hoisted(() => ({ selectMock: vi.fn() }))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(() => ({ select: selectMock })),
  },
}))

import { getWorkoutCount } from './workoutSessions.service'

describe('getWorkoutCount', () => {
  beforeEach(() => selectMock.mockReset())

  it('returns the exact historical count', async () => {
    selectMock.mockResolvedValue({ count: 42, error: null })
    await expect(getWorkoutCount()).resolves.toBe(42)
  })

  it('falls back to zero only when workout_sessions does not exist', async () => {
    selectMock.mockResolvedValue({ count: null, error: { code: 'PGRST205', message: 'table not found' } })
    await expect(getWorkoutCount()).resolves.toBe(0)
  })

  it.each(['42501', 'PGRST301', 'NETWORK_ERROR'])('propagates non-schema errors (%s)', async (code) => {
    const error = { code, message: 'request failed' }
    selectMock.mockResolvedValue({ count: null, error })
    await expect(getWorkoutCount()).rejects.toBe(error)
  })
})
