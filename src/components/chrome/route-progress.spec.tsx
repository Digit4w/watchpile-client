import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouteProgress } from './route-progress'

/**
 * O que a faixa DECIDE é quando existir: o limiar de `useDelayedPending`
 * aplicado à troca de rota. A navegação típica termina em dezenas de
 * milissegundos, e uma faixa que piscasse a cada clique seria ruído.
 */

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('RouteProgress', () => {
  it('stays hidden for a navigation that finishes under the threshold', () => {
    const { rerender } = render(<RouteProgress pending />)

    act(() => vi.advanceTimersByTime(150))
    rerender(<RouteProgress pending={false} />)
    act(() => vi.advanceTimersByTime(500))

    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('appears once the wait passes the threshold, with an accessible name', () => {
    render(<RouteProgress pending />)
    expect(screen.queryByRole('progressbar')).toBeNull()

    act(() => vi.advanceTimersByTime(200))

    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAccessibleName()
  })

  it('stays up for the minimum time even if the route arrives right after', () => {
    const { rerender } = render(<RouteProgress pending />)
    act(() => vi.advanceTimersByTime(210))
    expect(screen.getByRole('progressbar')).toBeInTheDocument()

    rerender(<RouteProgress pending={false} />)
    act(() => vi.advanceTimersByTime(100))
    expect(screen.getByRole('progressbar')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(250))
    expect(screen.queryByRole('progressbar')).toBeNull()
  })
})
