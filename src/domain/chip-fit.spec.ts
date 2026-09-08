import { describe, expect, it } from 'vitest'
import { fittingChips } from './chip-fit'

/** Oito chips de 100px, como os tipos medidos em 01/09/2026 (~98px cada). */
const OITO = Array.from({ length: 8 }, () => 100)

describe('fittingChips', () => {
  it('takes everything when there is room', () => {
    expect(fittingChips({ widths: OITO, gap: 8, available: 2000 })).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7,
    ])
  })

  it('counts the gap between chips, but not before the first', () => {
    // 3 chips = 300 de largura + 2 gaps de 8 = 316
    expect(fittingChips({ widths: OITO, gap: 8, available: 316 })).toEqual([
      0, 1, 2,
    ])
    // um pixel a menos e o terceiro não cabe
    expect(fittingChips({ widths: OITO, gap: 8, available: 315 })).toEqual([
      0, 1,
    ])
  })

  /**
   * O filtro ligado nunca vai pro menu: um recorte ativo que não aparece na
   * tela é o defeito que esta conta existe pra evitar.
   */
  it('always keeps the active chip, even when it is past the cut', () => {
    const fit = fittingChips({
      widths: OITO,
      gap: 8,
      available: 316,
      required: 7,
    })

    expect(fit).toContain(7)
    expect(fit).toHaveLength(3)
  })

  it('returns vocabulary order, never pick order', () => {
    expect(
      fittingChips({ widths: OITO, gap: 8, available: 500, required: 6 }),
      // 4 chips a 100 mais 3 gaps dá 424; um quinto passaria de 500
    ).toEqual([0, 1, 2, 6])
  })

  /**
   * Preencher o buraco com um chip de depois faria a fileira mudar de
   * composição ao redimensionar de um jeito imprevisível.
   */
  it('stops at the first chip that does not fit, without hunting for a smaller one', () => {
    const widths = [100, 400, 30, 30]
    expect(fittingChips({ widths, gap: 8, available: 200 })).toEqual([0])
  })

  it('shows the active chip even when it does not fit alone', () => {
    expect(
      fittingChips({ widths: OITO, gap: 8, available: 10, required: 5 }),
    ).toEqual([5])
  })

  it('shows nothing when nothing fits and nothing is active', () => {
    expect(fittingChips({ widths: OITO, gap: 8, available: 10 })).toEqual([])
  })

  it('ignores a required index that is not in the list', () => {
    expect(
      fittingChips({ widths: OITO, gap: 8, available: 208, required: 99 }),
    ).toEqual([0, 1])
  })

  it('takes an empty list without arithmetic on undefined', () => {
    expect(fittingChips({ widths: [], gap: 8, available: 500 })).toEqual([])
  })
})
