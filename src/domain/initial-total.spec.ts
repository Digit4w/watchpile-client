import { describe, expect, it } from 'vitest'
import { initialTotal, SINGLE_UNIT_TOTAL } from './initial-total'

describe('initialTotal', () => {
  it('dá 1 ao tipo que não conta, tenha ele digitado o que for', () => {
    // Filme e jogo: o status é o progresso, e o total é 1 porque a obra é uma.
    expect(initialTotal({ countsProgress: false, typed: null })).toBe(
      SINGLE_UNIT_TOTAL,
    )
    expect(initialTotal({ countsProgress: false, typed: 12 })).toBe(
      SINGLE_UNIT_TOTAL,
    )
  })

  it('usa o que foi digitado quando o tipo conta', () => {
    expect(initialTotal({ countsProgress: true, typed: 62 })).toBe(62)
  })

  it('trata vazio, zero e negativo como não preenchido', () => {
    // **Em branco é o "não se sabe o fim"**, e é assim que um mangá em
    // publicação nasce. Era isso que `asks_total: false` fazia, e por isso ele
    // não precisava existir: quem decide é a OBRA, não o tipo.
    for (const typed of [null, 0, -3, Number.NaN]) {
      expect(initialTotal({ countsProgress: true, typed })).toBeNull()
    }
  })
})
