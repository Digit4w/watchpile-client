import { describe, expect, it } from 'vitest'
import { ageBucket } from './notification-grouping'

const NOW = Date.parse('2026-09-05T22:00:00Z')

describe('ageBucket', () => {
  it('splits by age', () => {
    expect(ageBucket('2026-09-05T20:00:00Z', NOW)).toBe('today')
    expect(ageBucket('2026-09-03T22:00:00Z', NOW)).toBe('week')
    expect(ageBucket('2026-08-01T22:00:00Z', NOW)).toBe('earlier')
  })

  it('puts the boundary at the day, not at midnight', () => {
    expect(ageBucket('2026-09-04T22:00:01Z', NOW)).toBe('today')
    expect(ageBucket('2026-09-04T21:59:59Z', NOW)).toBe('week')
  })

  /**
   * O fundo da lista é onde um carimbo ilegível estraga menos: no topo, ele
   * empurraria o que de fato é de hoje pra baixo de uma linha sem data.
   */
  it('sends an unreadable stamp to the bottom, never to the top', () => {
    expect(ageBucket('não é data', NOW)).toBe('earlier')
  })
})
