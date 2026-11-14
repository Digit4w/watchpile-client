import { describe, expect, it } from 'vitest'
import { completedMark } from './completed-mark'

describe('completedMark', () => {
  it('marks completed at the end and drops the total, which the mark already says', () => {
    expect(
      completedMark({ status: 'completed', progress: 62, total: 62 }),
    ).toEqual({ done: true, showTotal: false })
  })

  /**
   * O caso que a inferência pelo número erraria: concluída antes do fim. O
   * total fica, porque é ele que diz que parou ali.
   */
  it('marks completed in the middle and keeps the total', () => {
    expect(
      completedMark({ status: 'completed', progress: 12, total: 24 }),
    ).toEqual({ done: true, showTotal: true })
  })

  it('keeps an unknown total next to the mark', () => {
    expect(
      completedMark({ status: 'completed', progress: 551, total: null }),
    ).toEqual({ done: true, showTotal: true })
  })

  /**
   * O outro lado da mesma régua: o número no fim NÃO marca. Se a regra lesse
   * `progress === total`, esta linha ganharia o ✓ e perderia o total.
   */
  it('does not mark a title that reached the end but is still watching', () => {
    expect(
      completedMark({ status: 'watching', progress: 62, total: 62 }),
    ).toEqual({ done: false, showTotal: true })
  })

  it('does not mark any other status', () => {
    for (const status of ['planned', 'dropped', 'on-hold'] as const) {
      expect(completedMark({ status, progress: 3, total: 3 })).toEqual({
        done: false,
        showTotal: true,
      })
    }
  })
})
